import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number; // in pennies
  title: string;
  category: string;
  description: string;
  date: string;
  status: 'success' | 'pending' | 'failed';
  receiptNumber: string;
  isCash?: boolean;
  paymentMethod?: 'cash' | 'sense_card' | 'atm';
  location?: string;
}

export interface CashEnvelope {
  id: string;
  name: string;
  amount: number; // in pennies
  targetAmount: number; // in pennies
  category: string;
  iconName: string;
}

export interface Jar {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  isActive: boolean;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  status: 'success' | 'failure';
  action: string;
}

export interface CashbackCategory {
  id: string;
  name: string;
  percent: number;
  iconName: string;
  selected: boolean;
}

interface AppState {
  user: {
    name: string;
    iban: string;
    cardNumber: string;
    cardHolder: string;
    cvv: string;
    expiryDate: string;
    balance: number; // card balance in pennies
    cashBalance: number; // cash balance in pennies
    cashbackBalance: number; // cashback balance in pennies
    creditLimit: number; // in pennies
    isCardFrozen: boolean;
    requireBiometrics?: boolean;
    cashModeEnabled: boolean;
    lastSyncDate?: string;
    phone?: string;
    email?: string;
  };
  transactions: Transaction[];
  securityLogs: SecurityLog[];
  jar: Jar;
  cashEnvelopes: CashEnvelope[];
  cashbackCategories: CashbackCategory[];
  
  updateUser: (user: Partial<AppState['user']>) => void;
  updateLastSyncDate: (date?: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'receiptNumber' | 'date'>) => void;
  editTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addCashExpense: (data: { amount: number; category: string; title: string; description?: string; location?: string }) => void;
  addCashIncome: (data: { amount: number; category: string; title: string; description?: string }) => void;
  atmWithdrawal: (amount: number) => boolean;
  depositCashToCard: (amount: number) => boolean;
  
  depositToJar: (amount: number) => void;
  
  addEnvelope: (data: { name: string; targetAmount: number; category: string; iconName: string }) => void;
  transferToEnvelope: (envelopeId: string, amount: number) => boolean;
  withdrawFromEnvelope: (envelopeId: string, amount: number) => boolean;
  
  toggleCashbackCategory: (categoryId: string) => void;
  withdrawCashback: () => boolean;
  toggleCardFreeze: () => void;
  setCreditLimit: (limit: number) => void;

  clearHistory: () => void;
  addSecurityLog: (log: Omit<SecurityLog, 'id' | 'timestamp'>) => void;
  clearSecurityLogs: () => void;
}

const defaultUser = {
  name: 'Олександр Сергійович',
  iban: 'UA89300001000002600123456789',
  cardNumber: '5375 4141 8888 9012',
  cardHolder: 'OLEKSANDR SERHIIOVYCH',
  cvv: '842',
  expiryDate: '08/29',
  balance: 3450000, // 34,500.00 UAH (Ne-OBank Card)
  cashBalance: 1285000, // 12,850.00 UAH (Physical Cash Wallet)
  cashbackBalance: 24500, // 245.00 UAH
  creditLimit: 5000000, // 50,000 UAH
  isCardFrozen: false,
  requireBiometrics: true,
  cashModeEnabled: true,
  lastSyncDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), // Initialized to 35 days ago to trigger 30-day reminder
  phone: '+380 97 123 45 67',
  email: 'oleksandr@neobank.app',
};

const defaultCashbackCategories: CashbackCategory[] = [
  { id: 'cat-1', name: 'Продукти та Супермаркети', percent: 2, iconName: 'ShoppingBag', selected: true },
  { id: 'cat-2', name: 'Кафе та Ресторани', percent: 3, iconName: 'Utensils', selected: true },
  { id: 'cat-3', name: 'Пальне та АЗС', percent: 4, iconName: 'Fuel', selected: false },
  { id: 'cat-4', name: 'Аптеки та Здоров\'я', percent: 5, iconName: 'HeartPulse', selected: false },
  { id: 'cat-5', name: 'Транспорт та Таксі', percent: 3, iconName: 'Home', selected: false },
  { id: 'cat-6', name: 'Розваги та Кіно', percent: 3, iconName: 'Smile', selected: false },
];

const defaultJar: Jar = {
  id: 'jar-1',
  title: 'Авто на ЗСУ 🛻',
  targetAmount: 25000000,
  currentAmount: 4560000,
  isActive: true,
};

const defaultEnvelopes: CashEnvelope[] = [
  {
    id: 'env-1',
    name: 'Продукти на місяць',
    amount: 350000, // 3,500 UAH
    targetAmount: 600000, // 6,000 UAH
    category: 'Продукти & Супермаркети',
    iconName: 'ShoppingBag'
  },
  {
    id: 'env-2',
    name: 'Пальне & Авто',
    amount: 200000, // 2,000 UAH
    targetAmount: 400000, // 4,000 UAH
    category: 'Транспорт & Авто',
    iconName: 'Fuel'
  },
  {
    id: 'env-3',
    name: 'Заначка у сейфі',
    amount: 500000, // 5,000 UAH
    targetAmount: 1000000, // 10,000 UAH
    category: 'Сейф / Накопичення',
    iconName: 'Vault'
  }
];

const defaultTransactions: Transaction[] = [
  {
    id: 'tx-101',
    type: 'expense',
    amount: 42000, // 420 UAH
    title: 'Супермаркет Сильпо',
    category: 'Продукти & Супермаркети',
    description: 'Оплата готівкою на касі',
    date: new Date().toISOString(),
    status: 'success',
    receiptNumber: 'CSH-8842-SENSE',
    isCash: true,
    paymentMethod: 'cash',
    location: 'м. Київ, вул. Хрещатик 12'
  },
  {
    id: 'tx-102',
    type: 'expense',
    amount: 200000, // 2,000 UAH
    title: 'Зняття готівки в банкоматі',
    category: 'Зняття з картки',
    description: 'ATM Sense Bank #4021',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    status: 'success',
    receiptNumber: 'ATM-9012-SENSE',
    isCash: false,
    paymentMethod: 'atm'
  },
  {
    id: 'tx-103',
    type: 'expense',
    amount: 18000, // 180 UAH
    title: 'Арома Кава',
    category: 'Кафе & Ресторани',
    description: 'Кава та круасан (готівка)',
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'success',
    receiptNumber: 'CSH-1123-SENSE',
    isCash: true,
    paymentMethod: 'cash'
  },
  {
    id: 'tx-104',
    type: 'income',
    amount: 500000, // 5,000 UAH
    title: 'Повернення боргу',
    category: 'Прибуток готівкою',
    description: 'Готівка від Андрія',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'success',
    receiptNumber: 'CSH-0092-SENSE',
    isCash: true,
    paymentMethod: 'cash'
  }
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      transactions: defaultTransactions,
      securityLogs: [],
      jar: defaultJar,
      cashEnvelopes: defaultEnvelopes,
      cashbackCategories: defaultCashbackCategories,

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
      updateLastSyncDate: (date) => set((state) => ({ user: { ...state.user, lastSyncDate: date || new Date().toISOString() } })),

      toggleCashbackCategory: (categoryId) => set((state) => {
        const selectedCount = state.cashbackCategories.filter(c => c.selected).length;
        const target = state.cashbackCategories.find(c => c.id === categoryId);
        if (!target) return state;
        if (!target.selected && selectedCount >= 2) {
          return state; // Limit max 2 selected categories
        }
        return {
          cashbackCategories: state.cashbackCategories.map(c => 
            c.id === categoryId ? { ...c, selected: !c.selected } : c
          )
        };
      }),

      withdrawCashback: () => {
        const state = get();
        if (state.user.cashbackBalance <= 0) return false;
        const amount = state.user.cashbackBalance;
        const newTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'income',
          amount,
          title: 'Виведення Кешбеку НЕ-ОБАНК',
          category: 'Кешбек',
          description: 'Зараховано на картку НЕ-ОБАНК',
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `CBK-${Math.floor(1000 + Math.random() * 9000)}-NEO`,
          isCash: false,
          paymentMethod: 'sense_card'
        };
        set({
          user: {
            ...state.user,
            cashbackBalance: 0,
            balance: state.user.balance + amount
          },
          transactions: [newTx, ...state.transactions]
        });
        return true;
      },

      toggleCardFreeze: () => set((state) => ({
        user: { ...state.user, isCardFrozen: !state.user.isCardFrozen }
      })),

      setCreditLimit: (limit) => set((state) => ({
        user: { ...state.user, creditLimit: limit }
      })),

      addTransaction: (tx) => set((state) => {
        const newTx: Transaction = {
          ...tx,
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          receiptNumber: Math.random().toString(36).substring(2, 14).toUpperCase().match(/.{1,4}/g)?.join('-') || '1234-5678-NEO',
          date: new Date().toISOString(),
        };
        const newBalance = state.user.balance + (tx.type === 'income' ? tx.amount : -tx.amount);
        return {
          transactions: [newTx, ...state.transactions],
          user: { ...state.user, balance: newBalance },
        };
      }),

      editTransaction: (id, updates) => set((state) => ({
        transactions: state.transactions.map(tx => tx.id === id ? { ...tx, ...updates } : tx)
      })),

      deleteTransaction: (id) => set((state) => ({
        transactions: state.transactions.filter(tx => tx.id !== id)
      })),

      addCashExpense: ({ amount, category, title, description, location }) => set((state) => {
        const newTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'expense',
          amount,
          title: title || 'Витрата готівкою',
          category,
          description: description || 'Оплата готівковими коштами',
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `CSH-${Math.floor(1000 + Math.random() * 9000)}-SENSE`,
          isCash: true,
          paymentMethod: 'cash',
          location
        };
        return {
          transactions: [newTx, ...state.transactions],
          user: { ...state.user, cashBalance: Math.max(0, state.user.cashBalance - amount) }
        };
      }),

      addCashIncome: ({ amount, category, title, description }) => set((state) => {
        const newTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'income',
          amount,
          title: title || 'Надходження готівки',
          category,
          description: description || 'Зарахування в готівковий гаманець',
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `CSH-${Math.floor(1000 + Math.random() * 9000)}-SENSE`,
          isCash: true,
          paymentMethod: 'cash'
        };
        return {
          transactions: [newTx, ...state.transactions],
          user: { ...state.user, cashBalance: state.user.cashBalance + amount }
        };
      }),

      atmWithdrawal: (amount) => {
        const state = get();
        if (state.user.balance < amount) return false;
        
        const cardTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'expense',
          amount,
          title: 'Зняття готівки в банкоматі',
          category: 'ATM Зняття',
          description: 'Sense ATM #0842',
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `ATM-${Math.floor(1000 + Math.random() * 9000)}-SENSE`,
          isCash: false,
          paymentMethod: 'atm'
        };

        const cashTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'income',
          amount,
          title: 'Зарахування з банкомату Sense',
          category: 'Готівка з картки',
          description: 'Знято з картки Camaleon в Cash Wallet',
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `CSH-${Math.floor(1000 + Math.random() * 9000)}-SENSE`,
          isCash: true,
          paymentMethod: 'cash'
        };

        set({
          user: {
            ...state.user,
            balance: state.user.balance - amount,
            cashBalance: state.user.cashBalance + amount,
          },
          transactions: [cashTx, cardTx, ...state.transactions]
        });
        return true;
      },

      depositCashToCard: (amount) => {
        const state = get();
        if (state.user.cashBalance < amount) return false;

        const cashTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'expense',
          amount,
          title: 'Внесення готівки на картку',
          category: 'Термінал Sense',
          description: 'Внесено через термінал в Cash Mode',
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `CSH-${Math.floor(1000 + Math.random() * 9000)}-SENSE`,
          isCash: true,
          paymentMethod: 'cash'
        };

        const cardTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'income',
          amount,
          title: 'Поповнення з готівки',
          category: 'Термінал Sense',
          description: 'Зараховано на рахунок Sense Camaleon',
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `DEP-${Math.floor(1000 + Math.random() * 9000)}-SENSE`,
          isCash: false,
          paymentMethod: 'sense_card'
        };

        set({
          user: {
            ...state.user,
            cashBalance: state.user.cashBalance - amount,
            balance: state.user.balance + amount,
          },
          transactions: [cardTx, cashTx, ...state.transactions]
        });
        return true;
      },

      depositToJar: (amount) => set((state) => {
        if (state.user.cashBalance < amount && state.user.balance < amount) return state;
        
        // prefer cash balance if available in Cash Mode
        const useCash = state.user.cashBalance >= amount;
        
        const newTx: Transaction = {
          id: `tx_${Math.random().toString(36).substring(2, 9)}`,
          type: 'expense',
          amount,
          title: 'Поповнення Банки Скарбнички',
          category: 'Скарбничка / Сейф',
          description: state.jar.title + (useCash ? ' (готівкою)' : ' (з картки)'),
          date: new Date().toISOString(),
          status: 'success',
          receiptNumber: `JAR-${Math.floor(1000 + Math.random() * 9000)}-SENSE`,
          isCash: useCash,
          paymentMethod: useCash ? 'cash' : 'sense_card'
        };

        return {
          user: {
            ...state.user,
            cashBalance: useCash ? state.user.cashBalance - amount : state.user.cashBalance,
            balance: !useCash ? state.user.balance - amount : state.user.balance
          },
          jar: { ...state.jar, currentAmount: state.jar.currentAmount + amount },
          transactions: [newTx, ...state.transactions]
        };
      }),

      addEnvelope: ({ name, targetAmount, category, iconName }) => set((state) => ({
        cashEnvelopes: [
          ...state.cashEnvelopes,
          {
            id: `env_${Math.random().toString(36).substring(2, 9)}`,
            name,
            amount: 0,
            targetAmount,
            category,
            iconName: iconName || 'Wallet'
          }
        ]
      })),

      transferToEnvelope: (envelopeId, amount) => {
        const state = get();
        if (state.user.cashBalance < amount) return false;

        set({
          user: { ...state.user, cashBalance: state.user.cashBalance - amount },
          cashEnvelopes: state.cashEnvelopes.map(env => 
            env.id === envelopeId ? { ...env, amount: env.amount + amount } : env
          )
        });
        return true;
      },

      withdrawFromEnvelope: (envelopeId, amount) => {
        const state = get();
        const env = state.cashEnvelopes.find(e => e.id === envelopeId);
        if (!env || env.amount < amount) return false;

        set({
          user: { ...state.user, cashBalance: state.user.cashBalance + amount },
          cashEnvelopes: state.cashEnvelopes.map(e => 
            e.id === envelopeId ? { ...e, amount: e.amount - amount } : e
          )
        });
        return true;
      },

      clearHistory: () => set({ transactions: [] }),

      addSecurityLog: (log) => set((state) => ({
        securityLogs: [
          {
            ...log,
            id: `log_${Math.random().toString(36).substring(2, 9)}`,
            timestamp: new Date().toISOString(),
          },
          ...(state.securityLogs || [])
        ].slice(0, 50)
      })),

      clearSecurityLogs: () => set({ securityLogs: [] }),
    }),
    {
      name: 'sensebank-cash-storage',
    }
  )
);
