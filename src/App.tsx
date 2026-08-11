import React, { useState, useEffect } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { uk } from 'date-fns/locale';
import { 
  CreditCard, PieChart, Settings, ArrowRightLeft, 
  CheckCircle2, AlertCircle, X, Bell, Smartphone,
  FileText, PiggyBank, Gift, UserCircle, Save, Fingerprint, ScanFace,
  Wallet, Eye, EyeOff, Plus, Minus, ShoppingBag, Fuel, Utensils, Home, HeartPulse, Smile,
  Vault, ArrowUpRight, ArrowDownLeft, Landmark, DollarSign, Receipt, Trash2, ShieldCheck, Lock,
  RefreshCw, ChevronRight, Copy, Share2, Cloud, Table, Search, CheckSquare
} from 'lucide-react';
import { cn } from './lib/utils';
import { useStore, Transaction, CashEnvelope } from './store';
import { initAuth, googleSignIn, logout } from './lib/auth';
import { exportTransactionsToDocs } from './lib/docsExport';
import { exportTransactionsToKeep } from './lib/keepExport';
import { exportTransactionsToSheets } from './lib/sheetsExport';
import { syncToFirestore, subscribeToFirestore, testConnection } from './lib/firestoreSync';
import { generateOfficialPDFReceipt } from './lib/pdfReceipt';
import { GoogleTasksModal } from './components/GoogleTasksModal';
import logoImg from './assets/images/neobank_logo_violet_1786469205094.jpg';

import { TurquoiseCard } from './components/TurquoiseCard';
import { TransfersModal } from './components/TransfersModal';
import { CashbackModal } from './components/CashbackModal';
import { CurrencyConverter } from './components/CurrencyConverter';
import { SyncReminderModal } from './components/SyncReminderModal';

interface Toast {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'push';
  subtitle?: string;
  category?: string;
  balance?: string;
  time?: string;
  iconType?: 'expense' | 'income' | 'card' | 'atm';
}

export default function App() {
  const { 
    user, 
    transactions, 
    cashEnvelopes, 
    securityLogs,
    jar,
    cashbackCategories,
    updateUser, 
    updateLastSyncDate,
    editTransaction,
    deleteTransaction,
    addCashExpense, 
    addCashIncome, 
    atmWithdrawal, 
    depositCashToCard,
    depositToJar,
    addEnvelope,
    transferToEnvelope,
    withdrawFromEnvelope,
    toggleCardFreeze,
    clearHistory, 
    addSecurityLog,
    clearSecurityLogs
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<'main' | 'envelopes' | 'transfers' | 'analytics' | 'settings'>('main');
  const [showBalance, setShowBalance] = useState(true);
  
  // Modals & BottomSheets
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isAtmOpen, setIsAtmOpen] = useState(false);
  const [isTransfersOpen, setIsTransfersOpen] = useState(false);
  const [isCashbackOpen, setIsCashbackOpen] = useState(false);
  const [isJarOpen, setIsJarOpen] = useState(false);
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  
  const [isEnvelopeModalOpen, setIsEnvelopeModalOpen] = useState(false);
  const [selectedEnvelope, setSelectedEnvelope] = useState<CashEnvelope | null>(null);
  const [envelopeActionType, setEnvelopeActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [isNewEnvelopeOpen, setIsNewEnvelopeOpen] = useState(false);
  
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isEditingTx, setIsEditingTx] = useState(false);
  const [editTxTitle, setEditTxTitle] = useState('');
  const [editTxCategory, setEditTxCategory] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxDesc, setEditTxDesc] = useState('');
  const [editTxLocation, setEditTxLocation] = useState('');

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileEmail, setProfileEmail] = useState(user.email || '');
  const [profileIban, setProfileIban] = useState(user.iban);
  const [profileCardHolder, setProfileCardHolder] = useState(user.cardHolder);
  const [profileCreditLimit, setProfileCreditLimit] = useState((user.creditLimit / 100).toString());

  const [authScreen, setAuthScreen] = useState<'app_start' | null>(user.requireBiometrics ? 'app_start' : null);
  
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form states
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Продукти & Супермаркети');
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  // New Envelope Form
  const [newEnvName, setNewEnvName] = useState('');
  const [newEnvTarget, setNewEnvTarget] = useState('');
  const [newEnvCat, setNewEnvCat] = useState('Продукти & Супермаркети');

  const showToast = (
    title: string, 
    message: string, 
    type: 'success' | 'error' | 'info' | 'push' = 'push',
    extra?: { subtitle?: string; category?: string; balance?: string; iconType?: 'expense' | 'income' | 'card' | 'atm' }
  ) => {
    const id = Math.random().toString(36);
    const time = format(new Date(), 'HH:mm');
    setToasts(prev => [...prev, { id, title, message, type, time, ...extra }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, type === 'push' ? 6000 : 4000);
  };

  const [searchQuery, setSearchQuery] = useState('');

  // Filter cash transactions
  const cashTransactions = transactions.filter(tx => tx.isCash !== false);
  
  // Real-time filtered transactions by title, category, or date
  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const titleMatch = (tx.title || '').toLowerCase().includes(q) || (tx.description || '').toLowerCase().includes(q);
    const categoryMatch = (tx.category || '').toLowerCase().includes(q);

    const dateObj = new Date(tx.date);
    const formattedDate1 = format(dateObj, 'dd.MM.yyyy').toLowerCase();
    const formattedDate2 = format(dateObj, 'd MMM', { locale: uk }).toLowerCase();
    const formattedDate3 = format(dateObj, 'd MMMM yyyy', { locale: uk }).toLowerCase();
    const isoDate = format(dateObj, 'yyyy-MM-dd').toLowerCase();

    let relativeDate = '';
    if (isToday(dateObj)) relativeDate = 'сьогодні';
    else if (isYesterday(dateObj)) relativeDate = 'вчора';

    const dateMatch =
      formattedDate1.includes(q) ||
      formattedDate2.includes(q) ||
      formattedDate3.includes(q) ||
      isoDate.includes(q) ||
      relativeDate.includes(q);

    return titleMatch || categoryMatch || dateMatch;
  });

  const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
    const date = new Date(tx.date);
    let dateKey = format(date, 'yyyy-MM-dd');
    if (isToday(date)) dateKey = 'Сьогодні';
    else if (isYesterday(date)) dateKey = 'Вчора';
    else dateKey = format(date, 'd MMM', { locale: uk });

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncReminderOpen, setIsSyncReminderOpen] = useState(false);

  // 30-day Google Docs / Keep Sync Reminder logic
  useEffect(() => {
    if (authScreen === null) {
      const lastSync = user.lastSyncDate;
      let days = 30;
      if (lastSync) {
        const diff = Date.now() - new Date(lastSync).getTime();
        days = Math.floor(diff / (1000 * 60 * 60 * 24));
      }
      if (days >= 30) {
        const timer = setTimeout(() => {
          setIsSyncReminderOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [user.lastSyncDate, authScreen]);

  useEffect(() => {
    testConnection();
    let unsubscribeFirestore: (() => void) | undefined;
    
    const unsubscribeAuth = initAuth(
      (user, token) => {
        setGoogleToken(token);
        unsubscribeFirestore = subscribeToFirestore();
      },
      () => {
        setGoogleToken(null);
        if (unsubscribeFirestore) unsubscribeFirestore();
      }
    );
    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  useEffect(() => {
    if (googleToken) {
      const unsub = useStore.subscribe(() => {
        syncToFirestore();
      });
      return unsub;
    }
  }, [googleToken]);

  const handleExportSheets = async () => {
    if (cashTransactions.length === 0) {
      showToast('NEO-N•BANK', 'Немає записів для експорту', 'error');
      return;
    }

    try {
      setIsExporting(true);
      let token = googleToken;
      if (!token) {
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
          setGoogleToken(token);
        } else {
          return;
        }
      }
      
      const { spreadsheetUrl } = await exportTransactionsToSheets(cashTransactions);
      updateLastSyncDate();
      setIsSyncReminderOpen(false);
      showToast('Google Sheets', 'Успішно експортовано в Google Sheets (Таблиці)', 'success');
    } catch (e: any) {
      if (
        e?.code !== 'auth/popup-closed-by-user' &&
        e?.code !== 'auth/cancelled-popup-request' &&
        !e?.message?.includes('popup-closed-by-user')
      ) {
        console.error(e);
        showToast('Google Sheets', 'Помилка експорту в Google Sheets', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportDocs = async () => {
    if (cashTransactions.length === 0) {
      showToast('NEO-N•BANK', 'Немає записів для експорту', 'error');
      return;
    }

    try {
      setIsExporting(true);
      let token = googleToken;
      if (!token) {
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
          setGoogleToken(token);
        } else {
          return;
        }
      }
      
      await exportTransactionsToDocs(cashTransactions);
      updateLastSyncDate();
      setIsSyncReminderOpen(false);
      showToast('Google Docs', 'Успішно експортовано виписку в Google Docs', 'success');
    } catch (e: any) {
      if (
        e?.code !== 'auth/popup-closed-by-user' &&
        e?.code !== 'auth/cancelled-popup-request' &&
        !e?.message?.includes('popup-closed-by-user')
      ) {
        console.error(e);
        showToast('Google Docs', 'Помилка експорту в Docs', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportKeep = async () => {
    if (cashTransactions.length === 0) {
      showToast('NEO-N•BANK', 'Немає записів для експорту', 'error');
      return;
    }

    try {
      setIsExporting(true);
      const res = await exportTransactionsToKeep(cashTransactions);
      updateLastSyncDate();
      setIsSyncReminderOpen(false);
      
      if (res.copied) {
        showToast(
          'Google Keep',
          '📋 Виписку скопійовано! Вставте її в Keep',
          'success'
        );
        // We attempt to open Google Keep for creation
        window.open('https://keep.google.com/#create', '_blank', 'noopener,noreferrer');
      } else {
        // Fallback if clipboard API fails
        showToast('Google Keep', 'Не вдалося скопіювати автоматично.', 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Google Keep', 'Помилка копіювання даних для Keep', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSnooze30Days = () => {
    updateLastSyncDate(new Date().toISOString());
    setIsSyncReminderOpen(false);
    showToast('NEO-N•BANK', 'Нагадування про резервне копіювання відкладено на 30 днів', 'info');
  };

  // Balances calculations
  const totalEnvelopeCash = cashEnvelopes.reduce((sum, env) => sum + env.amount, 0);
  const totalCashWallet = user.cashBalance + totalEnvelopeCash;
  const totalWealth = user.balance + totalCashWallet + jar.currentAmount + user.cashbackBalance;

  const displayCashBalance = (user.cashBalance / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayTotalCash = (totalCashWallet / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayCardBalance = (user.balance / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayTotalWealth = (totalWealth / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Add Expense submit
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.round(parseFloat(amountInput.replace(',', '.')) * 100);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Помилка', 'Введіть суму витрати', 'error');
      return;
    }
    
    addCashExpense({
      amount: parsedAmount,
      category: categoryInput,
      title: titleInput || categoryInput,
      description: descInput,
      location: locationInput
    });

    const amountFormatted = (parsedAmount / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const newBalFormatted = ((user.cashBalance - parsedAmount) / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const locStr = locationInput ? ` • ${locationInput}` : '';

    showToast(
      'NEO-N•BANK',
      `💸 Нова транзакція: -${amountFormatted} ₴`,
      'push',
      {
        subtitle: `${titleInput || categoryInput}${locStr}`,
        category: categoryInput,
        balance: `Готівковий залишок: ${newBalFormatted} ₴`,
        iconType: 'expense'
      }
    );

    setIsExpenseOpen(false);
    setAmountInput('');
    setTitleInput('');
    setDescInput('');
    setLocationInput('');
  };

  // Add Income submit
  const handleAddIncomeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.round(parseFloat(amountInput.replace(',', '.')) * 100);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Помилка', 'Введіть суму доходу', 'error');
      return;
    }
    
    addCashIncome({
      amount: parsedAmount,
      category: categoryInput,
      title: titleInput || 'Надходження готівки',
      description: descInput
    });

    const amountFormatted = (parsedAmount / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const newBalFormatted = ((user.cashBalance + parsedAmount) / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    showToast(
      'NEO-N•BANK',
      `💰 Нова транзакція: +${amountFormatted} ₴`,
      'push',
      {
        subtitle: titleInput || 'Надходження у готівковий гаманець',
        category: categoryInput,
        balance: `Готівковий залишок: ${newBalFormatted} ₴`,
        iconType: 'income'
      }
    );

    setIsIncomeOpen(false);
    setAmountInput('');
    setTitleInput('');
    setDescInput('');
  };

  // ATM Exchange submit
  const handleAtmAction = (type: 'withdraw' | 'deposit') => {
    const parsedAmount = Math.round(parseFloat(amountInput.replace(',', '.')) * 100);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('НЕ-ОБАНК', 'Введіть коректну суму', 'error');
      return;
    }

    if (type === 'withdraw') {
      const ok = atmWithdrawal(parsedAmount);
      if (!ok) {
        showToast('НЕ-ОБАНК', 'Недостатньо коштів на картці НЕ-ОБАНК', 'error');
        return;
      }
      const amountFormatted = (parsedAmount / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const cardBalFormatted = ((user.balance - parsedAmount) / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      showToast(
        'NEO-N•BANK',
        `🏧 Зняття в банкоматі: -${amountFormatted} ₴`,
        'push',
        {
          subtitle: 'Знято готівку з картки у гаманець',
          balance: `Баланс картки: ${cardBalFormatted} ₴`,
          iconType: 'atm'
        }
      );
    } else {
      const ok = depositCashToCard(parsedAmount);
      if (!ok) {
        showToast('НЕ-ОБАНК', 'Недостатньо готівки у гаманці', 'error');
        return;
      }
      const amountFormatted = (parsedAmount / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const cardBalFormatted = ((user.balance + parsedAmount) / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      showToast(
        'NEO-N•BANK',
        `📲 Поповнення картки: +${amountFormatted} ₴`,
        'push',
        {
          subtitle: 'Поповнено картку через термінал',
          balance: `Баланс картки: ${cardBalFormatted} ₴`,
          iconType: 'card'
        }
      );
    }
    setIsAtmOpen(false);
    setAmountInput('');
  };

  // Envelope transfer submit
  const handleEnvelopeActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnvelope) return;
    const parsedAmount = Math.round(parseFloat(amountInput.replace(',', '.')) * 100);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('НЕ-ОБАНК', 'Введіть суму', 'error');
      return;
    }

    if (envelopeActionType === 'deposit') {
      const ok = transferToEnvelope(selectedEnvelope.id, parsedAmount);
      if (!ok) {
        showToast('НЕ-ОБАНК', 'Недостатньо готівки в гаманці', 'error');
        return;
      }
      showToast('Конверти', `Перераховано ${(parsedAmount / 100).toFixed(2)} ₴ в конверт "${selectedEnvelope.name}"`, 'success');
    } else {
      const ok = withdrawFromEnvelope(selectedEnvelope.id, parsedAmount);
      if (!ok) {
        showToast('Конверти', 'Недостатньо коштів у конверті', 'error');
        return;
      }
      showToast('Конверти', `Вилучено ${(parsedAmount / 100).toFixed(2)} ₴ з конверта в готівковий гаманець`, 'success');
    }
    setIsEnvelopeModalOpen(false);
    setSelectedEnvelope(null);
    setAmountInput('');
  };

  // Create new Envelope
  const handleCreateEnvelope = (e: React.FormEvent) => {
    e.preventDefault();
    const target = Math.round(parseFloat(newEnvTarget.replace(',', '.')) * 100);
    if (!newEnvName || !target || target <= 0) {
      showToast('НЕ-ОБАНК', 'Вкажіть назву та цільову суму', 'error');
      return;
    }
    addEnvelope({
      name: newEnvName,
      targetAmount: target,
      category: newEnvCat,
      iconName: 'Vault'
    });
    showToast('Конверти', `Створено новий конверт "${newEnvName}"`, 'success');
    setIsNewEnvelopeOpen(false);
    setNewEnvName('');
    setNewEnvTarget('');
  };

  // Deposit to Jar submit
  const handleDepositJarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.round(parseFloat(amountInput.replace(',', '.')) * 100);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Скарбничка', 'Введіть суму поповнення', 'error');
      return;
    }
    depositToJar(parsedAmount);
    showToast('Скарбничка', `Поповнено Скарбничку на ${(parsedAmount / 100).toFixed(2)} ₴`, 'success');
    setIsJarOpen(false);
    setAmountInput('');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#06080C] text-white font-sans antialiased selection:bg-cyan-500 selection:text-black">
      
      {/* Toast Overlay - Push Notification Simulator */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "p-4 rounded-3xl shadow-2xl border backdrop-blur-2xl pointer-events-auto flex flex-col transition-all animate-in slide-in-from-top-4 duration-300",
              toast.type === 'push' 
                ? "bg-[#0C1322]/95 border-cyan-400/60 text-white shadow-cyan-500/25 ring-1 ring-cyan-400/30"
                : toast.type === 'success' 
                  ? "bg-teal-950/95 border-teal-400/40 text-white shadow-teal-500/10"
                  : toast.type === 'error' 
                    ? "bg-rose-950/95 border-rose-400/40 text-white shadow-rose-500/10"
                    : "bg-slate-900/95 border-slate-700 text-white"
            )}
          >
            {toast.type === 'push' ? (
              <div className="space-y-2.5">
                {/* Push Notification Header */}
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-400 to-teal-300 flex items-center justify-center font-black text-black text-[10px] shadow-sm">
                      N
                    </div>
                    <span className="text-[11px] font-extrabold text-cyan-300 tracking-wider uppercase">Ne•OBank App</span>
                    <span className="text-[10px] text-cyan-200/50 font-medium">• {toast.time || 'зараз'}</span>
                  </div>
                  <button 
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Push Notification Content */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-2">
                    <div className="text-xs font-black text-white tracking-tight flex items-center space-x-1.5">
                      <span>{toast.message}</span>
                    </div>
                    {toast.subtitle && (
                      <p className="text-[11px] text-cyan-100/90 font-medium leading-snug">{toast.subtitle}</p>
                    )}
                    {toast.balance && (
                      <p className="text-[10px] text-teal-300 font-mono font-semibold pt-0.5">{toast.balance}</p>
                    )}
                  </div>
                  <div className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shrink-0 shadow-inner">
                    <Bell className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between space-x-3">
                <div className="flex items-start space-x-3">
                  <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 shrink-0 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-cyan-300">{toast.title}</h4>
                    <p className="text-xs text-white/90 mt-0.5 leading-snug">{toast.message}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-white/40 hover:text-white transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Container simulating smartphone display */}
      <div className="w-full max-w-md h-[100dvh] md:h-[932px] md:max-h-[932px] bg-[#0A0D12] md:rounded-[48px] shadow-2xl relative overflow-hidden flex flex-col border border-violet-500/20">
        
        {/* Dynamic Island Header */}
        <div className="bg-[#0A0D12] pt-3 px-5 pb-2.5 flex justify-between items-center z-40 shrink-0 border-b border-violet-500/15">
          <div className="flex items-center space-x-2.5">
            <img src={logoImg} alt="Ne•OBank App" className="w-8 h-8 rounded-xl object-cover border border-violet-400/50 shadow-md shadow-violet-500/30" />
            <div>
              <span className="font-extrabold tracking-tight text-sm text-white">Ne•<span className="text-violet-400 font-black">OBank App</span></span>
              <span className="text-[10px] text-violet-200/60 block leading-tight font-medium">Violet Edition</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={() => {
                showToast(
                  'Ne-OBank',
                  '💸 Нова транзакція: -350.00 ₴',
                  'push',
                  {
                    subtitle: 'Продукти & Супермаркети • Сільпо',
                    balance: `Готівковий залишок: ${(user.cashBalance / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴`,
                    iconType: 'expense'
                  }
                );
              }}
              className="p-1.5 rounded-full bg-violet-500/15 hover:bg-violet-500/30 text-violet-300 transition-colors border border-violet-400/30"
              title="Тестове пуш-повідомлення"
            >
              <Bell className="w-4 h-4 animate-pulse text-violet-300" />
            </button>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-300">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
              <span className="text-[10px] font-bold tracking-wider uppercase">Live Sync</span>
            </div>
            <button 
              onClick={() => setAuthScreen('app_start')}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-violet-300 transition-colors"
              title="Заблокувати"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 no-scrollbar pb-24">

          {/* TAB 1: MAIN WALLET & CARD */}
          {activeTab === 'main' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Total Wealth Hero Card */}
              <div className="relative rounded-3xl bg-gradient-to-br from-[#082F49] via-[#0E7490] to-[#0A101D] p-5 border border-cyan-400/30 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/20 rounded-full filter blur-3xl pointer-events-none"></div>

                <div className="flex justify-between items-start mb-2 relative z-10">
                  <div>
                    <span className="text-[10px] text-cyan-100/70 font-semibold uppercase tracking-wider block">Загальний Капітал</span>
                    <p className="text-[11px] text-cyan-200/60 mt-0.5">Картка + Готівка + Сейф</p>
                  </div>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-cyan-300 border border-cyan-400/20 transition-colors"
                  >
                    {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>

                <div className="my-2 relative z-10">
                  <div className="text-3xl font-black tracking-tight text-white flex items-baseline">
                    {showBalance ? displayTotalWealth : '••••••'} <span className="text-xl font-bold text-cyan-300 ml-1.5">₴</span>
                  </div>
                </div>

                {/* Sub-breakdown */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-cyan-500/20 relative z-10">
                  <div className="p-2.5 rounded-2xl bg-black/30 border border-cyan-500/20">
                    <span className="text-[10px] text-cyan-200/70 block">Готівковий гаманець</span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {showBalance ? `${displayCashBalance} ₴` : '••••'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-black/30 border border-cyan-500/20">
                    <span className="text-[10px] text-cyan-200/70 block">Картка Ne•OBank App</span>
                    <span className="text-xs font-bold text-cyan-300 mt-0.5 block">
                      {showBalance ? `${displayCardBalance} ₴` : '••••'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Cash Operations Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => setIsExpenseOpen(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/15 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 mb-1.5">
                    <Minus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Витрата</span>
                  <span className="text-[9px] text-cyan-300/60">Готівка</span>
                </button>

                <button 
                  onClick={() => setIsIncomeOpen(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/15 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center text-teal-400 mb-1.5">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Дохід</span>
                  <span className="text-[9px] text-teal-300/60">Готівка</span>
                </button>

                <button 
                  onClick={() => setIsAtmOpen(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/15 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 mb-1.5">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Банкомат</span>
                  <span className="text-[9px] text-blue-300/60">Зняти/Внести</span>
                </button>

                <button 
                  onClick={() => setIsTransfersOpen(true)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/15 active:scale-95 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 mb-1.5">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-white">Перекази</span>
                  <span className="text-[9px] text-purple-300/60">P2P/IBAN</span>
                </button>
              </div>

              {/* Turquoise Platinum Card Component */}
              <TurquoiseCard 
                cardNumber={user.cardNumber}
                cardHolder={user.cardHolder}
                cvv={user.cvv}
                expiryDate={user.expiryDate}
                iban={user.iban}
                balance={user.balance}
                creditLimit={user.creditLimit}
                isFrozen={user.isCardFrozen}
                onToggleFreeze={toggleCardFreeze}
                showToast={showToast}
              />

              {/* Cashback Banner Widget */}
              <div className="p-4 rounded-3xl bg-[#121721] border border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Кешбек Ne•OBank App</h4>
                    <p className="text-[11px] text-cyan-300 font-bold">
                      {(user.cashbackBalance / 100).toFixed(2)} ₴ <span className="text-[10px] text-white/50 font-normal">• 2 категорії активні</span>
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsCashbackOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-400/30 transition-colors"
                >
                  Управління
                </button>
              </div>

              {/* Currency Converter */}
              <CurrencyConverter />

              {/* Transaction History Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Історія операцій</h3>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={handleExportKeep}
                      disabled={isExporting}
                      className="px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/30 transition text-[#FFBB00] rounded-lg flex items-center space-x-1 text-[10px] border border-cyan-500/20"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{isExporting ? '...' : 'В Keep'}</span>
                    </button>
                    <button
                      onClick={handleExportDocs}
                      disabled={isExporting}
                      className="px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/30 transition text-cyan-300 rounded-lg flex items-center space-x-1 text-[10px] border border-cyan-500/20"
                    >
                      <FileText className="w-3 h-3" />
                      <span>{isExporting ? '...' : 'В Docs'}</span>
                    </button>
                  </div>
                </div>

                {/* Search Input Field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400/60">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Пошук за назвою, категорією або датою..."
                    className="w-full pl-9 pr-8 py-2.5 bg-[#121721] border border-cyan-500/20 rounded-2xl text-xs text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyan-200/50 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {transactions.length === 0 ? (
                  <div className="p-8 text-center bg-[#121721] rounded-3xl border border-cyan-500/15">
                    <Receipt className="w-8 h-8 text-cyan-400/30 mx-auto mb-2" />
                    <p className="text-xs text-white/50">Транзакцій ще немає</p>
                  </div>
                ) : Object.keys(groupedTransactions).length === 0 ? (
                  <div className="p-8 text-center bg-[#121721] rounded-3xl border border-cyan-500/15 space-y-2">
                    <Search className="w-8 h-8 text-cyan-400/30 mx-auto" />
                    <p className="text-xs font-bold text-white/80">Нічого не знайдено</p>
                    <p className="text-[11px] text-cyan-200/50">За запитом «{searchQuery}» результатів немає</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-xs font-bold transition"
                    >
                      Скинути пошук
                    </button>
                  </div>
                ) : (
                  Object.entries(groupedTransactions).map(([date, txs]) => (
                    <div key={date} className="space-y-2">
                      <span className="text-[10px] font-bold text-cyan-300/70 uppercase tracking-widest px-1 block">{date}</span>
                      <div className="bg-[#121721] rounded-3xl border border-cyan-500/15 divide-y divide-cyan-500/10 overflow-hidden">
                        {txs.map(tx => (
                          <div 
                            key={tx.id}
                            onClick={() => setSelectedTx(tx)}
                            className="p-3.5 hover:bg-white/[0.03] transition flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                                tx.type === 'income' 
                                  ? "bg-teal-500/15 text-teal-400 border-teal-500/30" 
                                  : "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                              )}>
                                {tx.isCash ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white line-clamp-1">{tx.title}</h4>
                                <p className="text-[10px] text-cyan-200/60 mt-0.5">
                                  {tx.category} • {format(new Date(tx.date), 'HH:mm')}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={cn(
                                "text-xs font-black block font-mono",
                                tx.type === 'income' ? "text-teal-400" : "text-white"
                              )}>
                                {tx.type === 'income' ? '+' : '-'}{(tx.amount / 100).toFixed(2)} ₴
                              </span>
                              <span className="text-[9px] text-cyan-300/50 block font-mono mt-0.5">
                                {tx.receiptNumber}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 2: ENVELOPES & JAR */}
          {activeTab === 'envelopes' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-center px-1">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Конверти та Накопичення</h2>
                  <p className="text-[11px] text-cyan-200/60">Розподіляйте готівку за цілями</p>
                </div>
                <button 
                  onClick={() => setIsNewEnvelopeOpen(true)}
                  className="p-2 rounded-xl bg-cyan-500 text-black font-bold text-xs flex items-center space-x-1 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400"
                >
                  <Plus className="w-4 h-4" />
                  <span>Новий</span>
                </button>
              </div>

              {/* Envelopes list */}
              <div className="space-y-3">
                {cashEnvelopes.map((env) => {
                  const progress = Math.min(100, Math.round((env.amount / env.targetAmount) * 100));
                  return (
                    <div key={env.id} className="p-4 rounded-3xl bg-[#121721] border border-cyan-500/20 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                            <Vault className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white">{env.name}</h4>
                            <span className="text-[10px] text-cyan-300/70">{env.category}</span>
                          </div>
                        </div>

                        <span className="text-xs font-black text-cyan-300 font-mono">
                          {progress}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-cyan-500/20">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-white/60 font-mono">
                          <span>Зібрано: {(env.amount / 100).toLocaleString('uk-UA')} ₴</span>
                          <span>Ціль: {(env.targetAmount / 100).toLocaleString('uk-UA')} ₴</span>
                        </div>
                      </div>

                      {/* Envelope controls */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/10">
                        <button
                          onClick={() => {
                            setSelectedEnvelope(env);
                            setEnvelopeActionType('deposit');
                            setIsEnvelopeModalOpen(true);
                          }}
                          className="py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-400/30 transition"
                        >
                          + Поповнити
                        </button>
                        <button
                          onClick={() => {
                            setSelectedEnvelope(env);
                            setEnvelopeActionType('withdraw');
                            setIsEnvelopeModalOpen(true);
                          }}
                          className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold border border-white/10 transition"
                        >
                          - Вилучити
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Jar Widget */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#020617] border border-cyan-500/30 shadow-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{jar.title}</h4>
                      <p className="text-[10px] text-teal-300/80">Скарбничка / Банка</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsJarOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-teal-400 text-black text-xs font-extrabold hover:bg-teal-300 shadow-md shadow-teal-500/20 transition"
                  >
                    Закинути ₴
                  </button>
                </div>

                <div className="my-1">
                  <span className="text-[10px] text-teal-200/60 block uppercase font-medium">Зібрана сума</span>
                  <div className="text-2xl font-black text-white">
                    {(jar.currentAmount / 100).toLocaleString('uk-UA')} <span className="text-teal-300 text-sm">₴</span>
                  </div>
                </div>

                <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden border border-teal-500/30">
                  <div 
                    className="h-full bg-gradient-to-r from-teal-400 to-cyan-300 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((jar.currentAmount / jar.targetAmount) * 100))}%` }}
                  ></div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TRANSFERS & PAYMENTS */}
          {activeTab === 'transfers' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="px-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Перекази & Платежі</h2>
                <p className="text-[11px] text-cyan-200/60">Швидкі операції за один клік</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsTransfersOpen(true)}
                  className="p-4 rounded-3xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/20 text-left space-y-2 transition active:scale-95"
                >
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">На картку</h4>
                    <p className="text-[10px] text-cyan-300/60">Переказ P2P за 16 цифрами</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsTransfersOpen(true)}
                  className="p-4 rounded-3xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/20 text-left space-y-2 transition active:scale-95"
                >
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Мобільний</h4>
                    <p className="text-[10px] text-teal-300/60">Поповнення зв'язку</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsTransfersOpen(true)}
                  className="p-4 rounded-3xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/20 text-left space-y-2 transition active:scale-95"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">За IBAN</h4>
                    <p className="text-[10px] text-purple-300/60">Оплата за реквізитами</p>
                  </div>
                </button>

                <button
                  onClick={() => setIsTransfersOpen(true)}
                  className="p-4 rounded-3xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/20 text-left space-y-2 transition active:scale-95"
                >
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Комуналка</h4>
                    <p className="text-[10px] text-amber-300/60">Світло, вода, газ, інтернет</p>
                  </div>
                </button>
              </div>

              {/* Currency rates card */}
              <CurrencyConverter />
            </div>
          )}

          {/* TAB 4: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="px-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Аналітика Витрат</h2>
                <p className="text-[11px] text-cyan-200/60">Структура ваших платежів</p>
              </div>

              <div className="p-5 rounded-3xl bg-[#121721] border border-cyan-500/20 space-y-4">
                <div className="flex justify-between items-center border-b border-cyan-500/15 pb-3">
                  <span className="text-xs font-bold text-white">Розподіл за категоріями</span>
                  <span className="text-[10px] text-cyan-300 font-mono">Цей місяць</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white">Продукти & Супермаркети</span>
                      <span className="text-cyan-300">45% • 3,500 ₴</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-cyan-500/20">
                      <div className="h-full bg-cyan-400 w-[45%]"></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white">Пальне & Авто</span>
                      <span className="text-teal-400">30% • 2,000 ₴</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-cyan-500/20">
                      <div className="h-full bg-teal-400 w-[30%]"></div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-white">Кафе & Ресторани</span>
                      <span className="text-amber-400">15% • 1,200 ₴</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-cyan-500/20">
                      <div className="h-full bg-amber-400 w-[15%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS & SECURITY */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="px-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Налаштування & Безпека</h2>
                <p className="text-[11px] text-violet-200/60">Керування профілем та синхронізацією</p>
              </div>

              {/* Account profile card */}
              <div className="p-4 rounded-3xl bg-[#121721] border border-violet-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-violet-500/15 pb-3">
                  <div className="flex items-center space-x-3">
                    <img src={logoImg} alt="Profile Avatar" className="w-12 h-12 rounded-2xl object-cover border border-violet-400/40 shadow-md" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{user.name}</h4>
                      <p className="text-[10px] text-violet-300 font-mono mt-0.5">{user.iban}</p>
                      <p className="text-[10px] text-violet-200/60 font-mono">{user.phone} • {user.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsEditingProfile(!isEditingProfile);
                      setProfileName(user.name);
                      setProfilePhone(user.phone || '');
                      setProfileEmail(user.email || '');
                      setProfileIban(user.iban);
                      setProfileCardHolder(user.cardHolder);
                      setProfileCreditLimit((user.creditLimit / 100).toString());
                    }}
                    className="px-3 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 text-violet-300 font-bold text-xs transition"
                  >
                    {isEditingProfile ? 'Скасувати' : 'Змінити дані'}
                  </button>
                </div>

                {isEditingProfile && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const creditNum = Math.round(parseFloat(profileCreditLimit) * 100) || user.creditLimit;
                      updateUser({
                        name: profileName.trim(),
                        phone: profilePhone.trim(),
                        email: profileEmail.trim(),
                        iban: profileIban.trim(),
                        cardHolder: profileCardHolder.trim().toUpperCase(),
                        creditLimit: creditNum
                      });
                      setIsEditingProfile(false);
                      showToast('Ne-OBank', 'Персональні дані успішно оновлено!', 'success');
                    }}
                    className="space-y-3 pt-2 animate-in fade-in duration-200"
                  >
                    <div>
                      <label className="text-[10px] text-violet-200/70 font-medium block mb-1">ПІБ Власника</label>
                      <input 
                        type="text" required
                        value={profileName} onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Телефон</label>
                        <input 
                          type="text"
                          value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)}
                          className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Email</label>
                        <input 
                          type="email"
                          value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)}
                          className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Номер IBAN</label>
                      <input 
                        type="text" required
                        value={profileIban} onChange={(e) => setProfileIban(e.target.value)}
                        className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-1.5 text-xs font-mono text-violet-300 focus:outline-none focus:border-violet-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Им'я на картці</label>
                        <input 
                          type="text" required
                          value={profileCardHolder} onChange={(e) => setProfileCardHolder(e.target.value)}
                          className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Кредитний ліміт (₴)</label>
                        <input 
                          type="number" step="100" required
                          value={profileCreditLimit} onChange={(e) => setProfileCreditLimit(e.target.value)}
                          className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-1.5 text-xs text-violet-300 font-bold focus:outline-none focus:border-violet-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs shadow-lg shadow-violet-500/20 transition"
                    >
                      Зберегти зміни профілю
                    </button>
                  </form>
                )}
              </div>

              {/* Google Auth & Firestore Card */}
              <div className="p-4 rounded-3xl bg-[#121721] border border-violet-500/20 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white">Хмарна Синхронізація Firebase</h4>
                    <p className="text-[10px] text-violet-300/70">Firestore Database Integration</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold border",
                    googleToken ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-white/10 text-white/50 border-white/10"
                  )}>
                    {googleToken ? 'Підключено' : 'Офлайн'}
                  </span>
                </div>

                {!googleToken ? (
                  <button
                    onClick={async () => {
                      try {
                        const res = await googleSignIn();
                        if (res) {
                          setGoogleToken(res.accessToken);
                          showToast('Firebase', 'Успішно увійшли через Google Account', 'success');
                        }
                      } catch (e: any) {
                        if (
                          e?.code !== 'auth/popup-closed-by-user' &&
                          e?.code !== 'auth/cancelled-popup-request' &&
                          !e?.message?.includes('popup-closed-by-user')
                        ) {
                          showToast('Firebase', 'Помилка авторизації Google', 'error');
                        }
                      }
                    }}
                    className="w-full py-2.5 rounded-2xl bg-violet-500 text-white font-extrabold text-xs shadow-lg shadow-violet-500/20 hover:bg-violet-400 transition"
                  >
                    Увійти через Google для Синхронізації
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await logout();
                      setGoogleToken(null);
                      showToast('Firebase', 'Вийшли з акаунту Google', 'info');
                    }}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-xs transition"
                  >
                    Вийти з Google
                  </button>
                )}
              </div>

              {/* 30-Day Backup & Google Docs/Keep/Sheets Sync Reminder Card */}
              <div className="p-4 rounded-3xl bg-[#121721] border border-violet-500/20 space-y-3">
                <div className="flex justify-between items-center border-b border-violet-500/15 pb-2">
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-4 h-4 text-violet-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Резервне Копіювання (Кожні 30 днів)</h4>
                  </div>
                  <span className="text-[10px] text-violet-300 font-mono">
                    {user.lastSyncDate ? format(new Date(user.lastSyncDate), 'dd.MM.yyyy') : 'Немає копії'}
                  </span>
                </div>

                <p className="text-[11px] text-violet-200/70">
                  Автоматичне нагадування кожні 30 днів для збереження записів у Google Sheets, Docs чи Keep.
                </p>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <button
                    onClick={handleExportSheets}
                    disabled={isExporting}
                    className="p-2.5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] border border-violet-500/30 text-violet-300 font-bold text-xs transition flex items-center justify-center space-x-1"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Sheets</span>
                  </button>

                  <button
                    onClick={handleExportDocs}
                    disabled={isExporting}
                    className="p-2.5 rounded-2xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 text-violet-300 font-bold text-xs transition flex items-center justify-center space-x-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Docs</span>
                  </button>

                  <button
                    onClick={() => setIsSyncReminderOpen(true)}
                    className="p-2.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 font-bold text-xs transition flex items-center justify-center space-x-1"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Бекап (30д)</span>
                  </button>
                </div>
              </div>

              {/* Google Tasks Integration Card */}
              <div className="p-4 rounded-3xl bg-[#121721] border border-violet-500/20 space-y-3">
                <div className="flex justify-between items-center border-b border-violet-500/15 pb-2">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-violet-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Google Tasks Платіжне Планування</h4>
                  </div>
                  <span className="text-[10px] text-violet-300 font-mono">Tasks API</span>
                </div>

                <p className="text-[11px] text-violet-200/70">
                  Плануйте фінансові завдання, нагадування про оплату комуналки чи поповнення конвертів у Google Tasks.
                </p>

                <button
                  onClick={() => setIsTasksModalOpen(true)}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 hover:from-violet-400 hover:to-fuchsia-300 text-white font-extrabold text-xs shadow-lg shadow-violet-500/20 flex items-center justify-center space-x-2 transition"
                >
                  <CheckSquare className="w-4 h-4 text-white" />
                  <span>Відкрити Google Tasks Нагадування</span>
                </button>
              </div>

              {/* Push Notifications Simulator Card */}
              <div className="p-4 rounded-3xl bg-[#121721] border border-violet-500/20 space-y-3">
                <div className="flex items-center justify-between border-b border-violet-500/15 pb-2">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-violet-400 animate-pulse" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Симулятор Push-сповіщень</h4>
                  </div>
                  <span className="text-[10px] text-violet-300 font-mono">Ne-OBank Push</span>
                </div>
                <p className="text-[11px] text-violet-200/70">
                  Тестування push-сповіщень про нові транзакції, витрати та поповнення.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      showToast(
                        'Ne-OBank',
                        '💸 Нова транзакція: -280.00 ₴',
                        'push',
                        {
                          subtitle: 'Продукти & Супермаркети • Сільпо',
                          category: 'Продукти',
                          balance: `Готівковий залишок: ${(user.cashBalance / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴`,
                          iconType: 'expense'
                        }
                      );
                    }}
                    className="p-2.5 rounded-2xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 text-violet-300 font-bold text-xs transition text-left flex flex-col justify-between"
                  >
                    <span>Тест витрати 💸</span>
                    <span className="text-[9px] text-violet-200/50 font-normal mt-1">Симуляція списання</span>
                  </button>

                  <button
                    onClick={() => {
                      showToast(
                        'Ne-OBank',
                        '💰 Нова транзакція: +1,500.00 ₴',
                        'push',
                        {
                          subtitle: 'Надходження готівкового доходу',
                          category: 'Дохід',
                          balance: `Готівковий залишок: ${(user.cashBalance / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴`,
                          iconType: 'income'
                        }
                      );
                    }}
                    className="p-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 font-bold text-xs transition text-left flex flex-col justify-between"
                  >
                    <span>Тест доходу 💰</span>
                    <span className="text-[9px] text-emerald-200/50 font-normal mt-1">Симуляція поповнення</span>
                  </button>
                </div>
              </div>

              {/* Security Controls */}
              <div className="p-4 rounded-3xl bg-[#121721] border border-violet-500/20 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-violet-500/15 pb-2">Безпека Застосунку</h4>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-semibold text-white block">Біометричний захист (FaceID/TouchID)</span>
                    <span className="text-[10px] text-violet-300/60">Запит при вході в застосунок</span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={user.requireBiometrics}
                    onChange={(e) => {
                      updateUser({ requireBiometrics: e.target.checked });
                      showToast('Безпека', `Біометрію ${e.target.checked ? 'увімкнено' : 'вимкнено'}`, 'info');
                    }}
                    className="w-4 h-4 accent-violet-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Tab Bar */}
        <div className="bg-[#0A0D12] border-t border-violet-500/15 py-2 px-3 flex justify-around items-center z-40 shrink-0">
          <button
            onClick={() => setActiveTab('main')}
            className={cn(
              "flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all",
              activeTab === 'main' ? "text-violet-400 font-bold" : "text-white/40 hover:text-white"
            )}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Гаманець</span>
          </button>

          <button
            onClick={() => setActiveTab('envelopes')}
            className={cn(
              "flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all",
              activeTab === 'envelopes' ? "text-violet-400 font-bold" : "text-white/40 hover:text-white"
            )}
          >
            <Vault className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Конверти</span>
          </button>

          <button
            onClick={() => setActiveTab('transfers')}
            className={cn(
              "flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all",
              activeTab === 'transfers' ? "text-violet-400 font-bold" : "text-white/40 hover:text-white"
            )}
          >
            <ArrowRightLeft className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Перекази</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all",
              activeTab === 'analytics' ? "text-violet-400 font-bold" : "text-white/40 hover:text-white"
            )}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Аналітика</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all",
              activeTab === 'settings' ? "text-violet-400 font-bold" : "text-white/40 hover:text-white"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Налаштування</span>
          </button>
        </div>

      </div>

      {/* MODAL 1: ADD EXPENSE */}
      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Нова Витрата Готівкою</h3>
              <button onClick={() => setIsExpenseOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Сума (₴)</label>
                <input 
                  type="number" step="0.01" placeholder="0.00" required
                  value={amountInput} onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-violet-300 font-bold text-xl placeholder-white/20 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Категорія</label>
                <select 
                  value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-violet-400"
                >
                  <option value="Продукти & Супермаркети">Продукти & Супермаркети</option>
                  <option value="Кафе & Ресторани">Кафе & Ресторани</option>
                  <option value="Пальне & Авто">Пальне & Авто</option>
                  <option value="Транспорт & Таксі">Транспорт & Таксі</option>
                  <option value="Аптеки & Здоров'я">Аптеки & Здоров'я</option>
                  <option value="Розваги & Дозвілля">Розваги & Дозвілля</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Назва / Опис</label>
                <input 
                  type="text" placeholder="Наприклад: Сильпо, Арома Кава"
                  value={titleInput} onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-violet-400"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-2xl bg-violet-500 text-white font-extrabold text-sm hover:bg-violet-400 transition shadow-lg shadow-violet-500/25">
                Зберегти витрату
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD INCOME */}
      {isIncomeOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Надходження Готівки</h3>
              <button onClick={() => setIsIncomeOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleAddIncomeSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Сума (₴)</label>
                <input 
                  type="number" step="0.01" placeholder="0.00" required
                  value={amountInput} onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-violet-300 font-bold text-xl placeholder-white/20 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Джерело</label>
                <input 
                  type="text" placeholder="Наприклад: Зарплата готівкою, Борг від друга"
                  value={titleInput} onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-violet-400"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-2xl bg-violet-500 text-white font-extrabold text-sm hover:bg-violet-400 transition shadow-lg shadow-violet-500/25">
                Зарахувати дохід
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ATM EXCHANGE */}
      {isAtmOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Банкомат & Термінал Ne•OBank App</h3>
              <button onClick={() => setIsAtmOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Сума операції (₴)</label>
                <input 
                  type="number" step="0.01" placeholder="0.00" required
                  value={amountInput} onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-violet-300 font-bold text-xl placeholder-white/20 focus:outline-none focus:border-violet-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAtmAction('withdraw')}
                  className="py-3 rounded-2xl bg-violet-500 text-white font-extrabold text-xs hover:bg-violet-400 transition"
                >
                  Зняти в готівку 🏧
                </button>
                <button
                  type="button"
                  onClick={() => handleAtmAction('deposit')}
                  className="py-3 rounded-2xl bg-fuchsia-600 text-white font-extrabold text-xs hover:bg-fuchsia-500 transition"
                >
                  Внести на картку 💳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TRANSFERS & PAYMENTS */}
      <TransfersModal 
        isOpen={isTransfersOpen}
        onClose={() => setIsTransfersOpen(false)}
        showToast={showToast}
      />

      {/* MODAL 5: CASHBACK */}
      <CashbackModal
        isOpen={isCashbackOpen}
        onClose={() => setIsCashbackOpen(false)}
        showToast={showToast}
      />

      {/* MODAL 6: ENVELOPE DEPOSIT/WITHDRAW */}
      {isEnvelopeModalOpen && selectedEnvelope && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {envelopeActionType === 'deposit' ? 'Поповнення Конверта' : 'Вилучення з Конверта'}
              </h3>
              <button onClick={() => setIsEnvelopeModalOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleEnvelopeActionSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Конверт: {selectedEnvelope.name}</label>
                <input 
                  type="number" step="0.01" placeholder="0.00" required
                  value={amountInput} onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-violet-300 font-bold text-xl placeholder-white/20 focus:outline-none focus:border-violet-400"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-2xl bg-violet-500 text-white font-extrabold text-sm hover:bg-violet-400 transition shadow-lg shadow-violet-500/25">
                Підтвердити
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: CREATE ENVELOPE */}
      {isNewEnvelopeOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Створити Новий Конверт</h3>
              <button onClick={() => setIsNewEnvelopeOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateEnvelope} className="space-y-3">
              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Назва цілі</label>
                <input 
                  type="text" placeholder="Наприклад: Відпустка, Ремонт" required
                  value={newEnvName} onChange={(e) => setNewEnvName(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Цільова сума (₴)</label>
                <input 
                  type="number" step="0.01" placeholder="10000" required
                  value={newEnvTarget} onChange={(e) => setNewEnvTarget(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-violet-300 font-bold text-lg focus:outline-none focus:border-violet-400"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-2xl bg-violet-500 text-white font-extrabold text-sm hover:bg-violet-400 transition shadow-lg shadow-violet-500/25">
                Створити Конверт
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: JAR DEPOSIT */}
      {isJarOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Поповнення Скарбнички</h3>
              <button onClick={() => setIsJarOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleDepositJarSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-violet-200/80 font-medium block mb-1">Сума поповнення (₴)</label>
                <input 
                  type="number" step="0.01" placeholder="0.00" required
                  value={amountInput} onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-black/50 border border-violet-500/30 rounded-xl px-3.5 py-2.5 text-violet-300 font-bold text-xl focus:outline-none focus:border-violet-400"
                />
              </div>

              <button type="submit" className="w-full py-3 rounded-2xl bg-violet-500 text-white font-extrabold text-sm hover:bg-violet-400 transition shadow-lg shadow-violet-500/25">
                Закинути у Скарбничку
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: TRANSACTION DETAILS & OFFICIAL PDF STAMPED RECEIPT & EDIT/DELETE */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0F172A] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {isEditingTx ? 'Редагування Транзакції' : 'Деталі Платежу'}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedTx(null);
                  setIsEditingTx(false);
                }} 
                className="text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isEditingTx ? (
              <div className="space-y-4">
                <div className="space-y-3 bg-black/40 p-4 rounded-2xl border border-violet-500/15">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-violet-200/70">Номер квитанції:</span>
                    <span className="text-xs font-mono font-bold text-violet-300">{selectedTx.receiptNumber}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-violet-200/70">Назва:</span>
                    <span className="text-xs font-bold text-white">{selectedTx.title}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-violet-200/70">Категорія:</span>
                    <span className="text-xs text-white">{selectedTx.category}</span>
                  </div>

                  {selectedTx.description && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-violet-200/70">Опис:</span>
                      <span className="text-xs text-violet-100">{selectedTx.description}</span>
                    </div>
                  )}

                  {selectedTx.location && (
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-violet-200/70">Місце:</span>
                      <span className="text-xs text-violet-100">{selectedTx.location}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-violet-200/70">Дата та час:</span>
                    <span className="text-xs text-white font-mono">{new Date(selectedTx.date).toLocaleString('uk-UA')}</span>
                  </div>

                  <div className="flex justify-between items-center border-t border-violet-500/10 pt-2">
                    <span className="text-xs font-bold text-white">Сума:</span>
                    <span className="text-base font-black text-violet-300 font-mono">
                      {selectedTx.type === 'income' ? '+' : '-'}{(selectedTx.amount / 100).toFixed(2)} ₴
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    generateOfficialPDFReceipt(selectedTx);
                    showToast('Ne•OBank App', 'Завантажено офіційний PDF чек з печаткою', 'success');
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-400 hover:from-violet-400 hover:to-fuchsia-300 text-white font-extrabold text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center space-x-2 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Завантажити Офіційний PDF Чек з Печаткою</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsEditingTx(true);
                      setEditTxTitle(selectedTx.title);
                      setEditTxCategory(selectedTx.category);
                      setEditTxAmount((selectedTx.amount / 100).toString());
                      setEditTxDesc(selectedTx.description || '');
                      setEditTxLocation(selectedTx.location || '');
                    }}
                    className="py-2.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-400/30 text-violet-300 font-bold text-xs transition flex items-center justify-center space-x-1"
                  >
                    <span>Редагувати</span>
                  </button>

                  <button
                    onClick={() => {
                      deleteTransaction(selectedTx.id);
                      setSelectedTx(null);
                      showToast('Ne•OBank App', 'Транзакцію успішно видалено з історії', 'info');
                    }}
                    className="py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 font-bold text-xs transition flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Видалити</span>
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const parsedAmt = Math.round(parseFloat(editTxAmount) * 100) || selectedTx.amount;
                  editTransaction(selectedTx.id, {
                    title: editTxTitle.trim(),
                    category: editTxCategory.trim(),
                    amount: parsedAmt,
                    description: editTxDesc.trim(),
                    location: editTxLocation.trim()
                  });
                  setSelectedTx({
                    ...selectedTx,
                    title: editTxTitle.trim(),
                    category: editTxCategory.trim(),
                    amount: parsedAmt,
                    description: editTxDesc.trim(),
                    location: editTxLocation.trim()
                  });
                  setIsEditingTx(false);
                  showToast('Ne•OBank App', 'Дані транзакції оновлено!', 'success');
                }}
                className="space-y-3"
              >
                <div>
                  <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Назва транзакції</label>
                  <input
                    type="text" required
                    value={editTxTitle} onChange={(e) => setEditTxTitle(e.target.value)}
                    className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Категорія</label>
                    <input
                      type="text" required
                      value={editTxCategory} onChange={(e) => setEditTxCategory(e.target.value)}
                      className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Сума (₴)</label>
                    <input
                      type="number" step="0.01" required
                      value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)}
                      className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-2 text-xs font-bold text-violet-300 focus:outline-none focus:border-violet-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Опис / Нотатки</label>
                  <input
                    type="text"
                    value={editTxDesc} onChange={(e) => setEditTxDesc(e.target.value)}
                    className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-violet-200/70 font-medium block mb-1">Місце проведення</label>
                  <input
                    type="text"
                    value={editTxLocation} onChange={(e) => setEditTxLocation(e.target.value)}
                    className="w-full bg-black/60 border border-violet-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-400"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingTx(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-extrabold text-xs shadow-lg shadow-violet-500/20 transition"
                  >
                    Зберегти
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 10: 30-DAY SYNC REMINDER MODAL */}
      <SyncReminderModal
        isOpen={isSyncReminderOpen}
        onClose={() => setIsSyncReminderOpen(false)}
        onExportSheets={handleExportSheets}
        onExportDocs={handleExportDocs}
        onExportKeep={handleExportKeep}
        onOpenTasks={() => setIsTasksModalOpen(true)}
        lastSyncDate={user.lastSyncDate}
        isExporting={isExporting}
        onSnooze30Days={handleSnooze30Days}
      />

      {/* MODAL 11: GOOGLE TASKS MODAL */}
      <GoogleTasksModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        showToast={showToast}
        googleToken={googleToken}
        setGoogleToken={setGoogleToken}
      />

      {/* START LOCK SCREEN / BIOMETRIC AUTH */}
      {authScreen === 'app_start' && (
        <div className="fixed inset-0 z-50 bg-[#0A0D12] flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 flex items-center justify-center font-black text-white text-3xl shadow-2xl shadow-violet-500/30 animate-pulse">
            Ne
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-white">Ne•OBank App</h2>
            <p className="text-xs text-violet-200/60">Вхід захищено біометрією</p>
          </div>

          <button
            onClick={() => {
              setAuthScreen(null);
              showToast('Ne•OBank App', 'Доступ підтверджено через FaceID', 'success');
            }}
            className="p-6 rounded-full bg-violet-500/15 border border-violet-400/30 text-violet-300 hover:bg-violet-500/25 transition active:scale-90"
          >
            <ScanFace className="w-12 h-12" />
          </button>

          <span className="text-[11px] text-violet-300/50">Натисніть для сканування FaceID / Сканера</span>
        </div>
      )}

    </div>
  );
}
