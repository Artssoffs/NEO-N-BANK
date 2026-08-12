import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  setPersistence, 
  browserLocalPersistence, 
  inMemoryPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure fallback persistence proactively for sandboxed iframe environments
setPersistence(auth, browserLocalPersistence).catch(() => {
  setPersistence(auth, inMemoryPersistence).catch(() => {});
});

const dbId = (firebaseConfig as any).firestoreDatabaseId || (firebaseConfig as any).databaseId || 'ai-studio-monobankacquirin-ff2847c3-00ae-4682-a8f4-457fd01ca8e1';
export const db = getFirestore(app, dbId);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/tasks.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      await setPersistence(auth, inMemoryPersistence);
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      console.log('Google Sign-in popup was closed by user.');
      return null;
    }

    // Catch IndexedDB / "Database is closing/hidden" / iframe storage errors
    if (
      error?.message?.includes('Database is closing') ||
      error?.message?.includes('hidden') ||
      error?.message?.includes('indexedDB') ||
      error?.message?.includes('IndexedDB') ||
      error?.code === 'auth/internal-error' ||
      error?.code === 'auth/web-storage-unsupported'
    ) {
      console.warn('IndexedDB database closing/hidden error detected. Retrying with inMemoryPersistence...');
      try {
        await setPersistence(auth, inMemoryPersistence);
        const retryResult = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(retryResult);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          return { user: retryResult.user, accessToken: cachedAccessToken };
        }
      } catch (retryError: any) {
        if (
          retryError?.code === 'auth/popup-closed-by-user' ||
          retryError?.code === 'auth/cancelled-popup-request' ||
          retryError?.message?.includes('popup-closed-by-user')
        ) {
          return null;
        }
        console.error('Sign-in retry with inMemoryPersistence failed:', retryError);
      }
    }

    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn('Logout warning:', e);
  }
  cachedAccessToken = null;
};
