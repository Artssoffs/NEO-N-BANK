import { doc, getDocFromServer, setDoc, collection, query, getDocs, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, auth } from './auth';
import { useStore, Transaction, CashEnvelope } from '../store';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure connection works safely
export async function testConnection() {
  try {
    if (auth.currentUser) {
      await getDocFromServer(doc(db, 'users', auth.currentUser.uid));
    }
  } catch (error) {
    console.log("Firestore connection status:", error instanceof Error ? error.message : error);
  }
}

// Push local state to Firestore (Simplified: syncs user profile and full transactions if not too many)
export async function syncToFirestore() {
  const user = auth.currentUser;
  if (!user) return;
  
  const state = useStore.getState();
  
  try {
    const userRef = doc(db, 'users', user.uid);
    const now = new Date().toISOString();
    
    // Save user profile
    await setDoc(userRef, {
      name: user.displayName || state.user.name || 'User',
      balance: state.user.balance ?? 0,
      cashBalance: state.user.cashBalance ?? 0,
      requireBiometrics: !!state.user.requireBiometrics,
      jar: {
        title: state.jar.title || 'Накопичувальна Банка',
        currentAmount: state.jar.currentAmount ?? 0,
        targetAmount: state.jar.targetAmount ?? 0,
      },
      updatedAt: now,
      createdAt: now,
    }, { merge: true });
    
    // Batch update top items
    const batch = writeBatch(db);
    state.transactions.slice(0, 20).forEach(tx => {
      const txRef = doc(db, `users/${user.uid}/transactions`, tx.id);
      const txPayload: any = {
        userId: user.uid,
        type: tx.type,
        amount: tx.amount,
        title: tx.title,
        category: tx.category,
        date: tx.date,
        status: tx.status,
        receiptNumber: tx.receiptNumber,
      };
      if (tx.description) txPayload.description = tx.description;
      if (tx.isCash !== undefined) txPayload.isCash = tx.isCash;
      if (tx.paymentMethod) txPayload.paymentMethod = tx.paymentMethod;
      if (tx.location) txPayload.location = tx.location;
      
      batch.set(txRef, txPayload, { merge: true });
    });
    
    state.cashEnvelopes.forEach(env => {
      const envRef = doc(db, `users/${user.uid}/cashEnvelopes`, env.id);
      batch.set(envRef, {
        userId: user.uid,
        name: env.name,
        amount: env.amount,
        targetAmount: env.targetAmount,
        category: env.category,
        iconName: env.iconName,
      }, { merge: true });
    });

    state.securityLogs.slice(0, 10).forEach(log => {
      const logRef = doc(db, `users/${user.uid}/securityLogs`, log.id);
      batch.set(logRef, {
        userId: user.uid,
        timestamp: log.timestamp,
        status: log.status === 'failure' ? 'failed' : log.status,
        action: log.action || 'settings_change',
      }, { merge: true });
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

export function subscribeToFirestore() {
  const user = auth.currentUser;
  if (!user) return () => {};

  const userRef = doc(db, 'users', user.uid);
  const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      useStore.setState(state => ({
        user: {
          ...state.user,
          balance: data.balance ?? state.user.balance,
          cashBalance: data.cashBalance ?? state.user.cashBalance,
          requireBiometrics: data.requireBiometrics ?? state.user.requireBiometrics,
        },
        jar: data.jar ?? state.jar
      }));
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
  });
  
  const txQuery = query(collection(db, `users/${user.uid}/transactions`));
  const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach(doc => txs.push(doc.data() as Transaction));
    if (txs.length > 0) {
      // Sort descending by date
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      useStore.setState({ transactions: txs });
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/transactions`);
  });

  const envQuery = query(collection(db, `users/${user.uid}/cashEnvelopes`));
  const unsubscribeEnv = onSnapshot(envQuery, (snapshot) => {
    const envs: CashEnvelope[] = [];
    snapshot.forEach(doc => envs.push(doc.data() as CashEnvelope));
    if (envs.length > 0) {
      useStore.setState({ cashEnvelopes: envs });
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/cashEnvelopes`);
  });

  return () => {
    unsubscribeUser();
    unsubscribeTx();
    unsubscribeEnv();
  };
}
