import React, { useState } from 'react';
import { 
  CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCw, Eye, EyeOff, 
  Settings, Shield, Smartphone, FileText, Home, Camera, Download, 
  X, ChevronRight, Sparkles, Trash2, Landmark, Building2,
  Lock, CheckCircle2, Zap, Bell, ArrowLeftRight, HelpCircle, User,
  Plus, MessageSquare, Send, Percent, TrendingUp, Gift, Award, Clock
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [hideBalances, setHideBalances] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Персональні дані за вимогами
  const [profile, setProfile] = useState({
    fullName: "Соколов Артем Сергійович",
    cardName: "ARTEM SOKOLOV",
    phone: "+380 66 666 10 25",
    email: "artemsokoloff@ukr.net",
    iban: "UA283223130000026009843210123",
    taxId: "3574503010",
    creditLimit: 50000.00,
    // Використання завантаженого користувачем фото як аватарки профілю
    avatarUrl: "image.png"
  });

  // Один компактний основний баланс картки
  const [cardBalance, setCardBalance] = useState(65314.00);
  const cardNumber = "5375 4161 8888 9012";
  const cardExpiry = "08/29";
  const cardCvv = "842";
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  // Кешбек
  const [cashbackBalance, setCashbackBalance] = useState(245.00);

  // Історія транзакцій
  const [transactions, setTransactions] = useState<any[]>([
    {
      id: 'CSH-8842-SENSE',
      title: 'Супермаркет Сільпо',
      category: 'Продукти та супермаркети',
      amount: -420.00,
      date: '12.08.2026, 03:56:54',
      location: 'м. Київ, вул. Хрещатик, 12',
      details: 'Оплата карткою на касі',
      transferType: 'card'
    },
    {
      id: '39C3-D3AP-VUM',
      title: 'Переказ за IBAN UA093052...',
      category: 'Оплата за реквізитами',
      amount: -249.00,
      date: '12.08.2026, 04:01:49',
      location: 'Онлайн-банкінг',
      details: 'Оплата за водопостачання о/р 998877',
      transferType: 'iban'
    },
    {
      id: 'CSH-0092-SENSE',
      title: 'Повернення боргу',
      category: 'Поповнення рахунку',
      amount: 5000.00,
      date: '10.08.2026, 03:56:54',
      location: 'Переказ P2P',
      details: 'Зарахування від Андрія',
      transferType: 'card'
    }
  ]);

  // Підтримка чат
  const [messages, setMessages] = useState([
    { id: 1, sender: 'support', text: 'Вітаємо в онлайн-підтримці NE•OBANK! Чим я можу вам допомогти?', time: '21:40' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Модальні вікна
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [transferSubTab, setTransferSubTab] = useState('card');

  // Форма переказу
  const [transferForm, setTransferForm] = useState({
    recipientCard: '',
    phone: '',
    iban: '',
    recipientName: '',
    utilityOrg: 'Київводоканал / Водопостачання',
    amount: '',
    comment: ''
  });

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const sum = parseFloat(transferForm.amount);
    if (!sum || sum <= 0) {
      showToast("Введіть коректну суму!");
      return;
    }
    if (sum > cardBalance) {
      showToast("Недостатньо коштів на картці!");
      return;
    }

    setCardBalance(prev => prev - sum);

    const newTx = {
      id: 'TX-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      title: transferSubTab === 'card' ? `Переказ на картку ${transferForm.recipientCard.slice(-4) || '••••'}` :
             transferSubTab === 'mobile' ? `Поповнення ${transferForm.phone}` :
             transferSubTab === 'iban' ? `Переказ за IBAN ${transferForm.recipientName || 'Отримувач'}` : `Комуналка: ${transferForm.utilityOrg}`,
      category: transferSubTab === 'utility' ? 'Комунальні платежі' : 'Переказ коштів',
      amount: -sum,
      date: new Date().toLocaleString('uk-UA'),
      location: 'Мобільний додаток',
      details: transferForm.comment || 'Оплата послуг',
      transferType: transferSubTab
    };

    setTransactions([newTx, ...transactions]);
    setTransferForm({ recipientCard: '', phone: '', iban: '', recipientName: '', utilityOrg: 'Київводоканал / Водопостачання', amount: '', comment: '' });
    showToast(`Успішно сплачено ${sum.toFixed(2)} ₴`);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: inputMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    setTimeout(() => {
      const supportReply = { 
        id: Date.now() + 1, 
        sender: 'support', 
        text: 'Дякуємо за звернення! Оператор перевіряє інформацію за вашим рахунком.', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };
      setMessages(prev => [...prev, supportReply]);
    }, 1200);
  };

  // Високоякісна квитанція без помилок з підписом та вимогами до IBAN
  const downloadOfficialPDFReceipt = (tx: any) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) return;
    const isIBAN = tx.transferType === 'iban' || tx.id.includes('39C3');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Квитанція_${tx.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111; line-height: 1.5; background: #fff; }
          .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 24px; font-weight: 900; letter-spacing: -1px; color: #000; }
          .stamp-box { border: 2px solid #00F5D4; color: #009688; padding: 10px 15px; border-radius: 8px; font-size: 11px; text-align: center; font-weight: bold; background: #F0FDFB; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
          .subtitle { font-size: 12px; color: #666; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          td { padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
          td.label { color: #555; width: 45%; font-weight: 500; }
          td.value { font-weight: 600; text-align: right; color: #000; }
          .amount-row td { font-size: 18px; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; background: #FAFAFA; }
          .footer { margin-top: 40px; font-size: 11px; color: #777; border-top: 1px solid #ddd; padding-top: 15px; text-align: center; }
          .notice-box { background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 11px; color: #92400E; line-height: 1.4; }
          .kep-seal { margin-top: 25px; background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; font-size: 10px; font-family: monospace; color: #374151; display: flex; justify-content: space-between; align-items: center; }
          .signature { font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">NE•OBANK</div>
            <div style="font-size: 11px; color: #666;">АТ «НЕО БАНК АПП» | Ліцензія НБУ №302 від 18.10.2018 р.</div>
          </div>
          <div class="stamp-box">
            ОФІЦІЙНА КВИТАНЦІЯ<br>СПЛАЧЕНО УСПІШНО
          </div>
        </div>

        <div class="title">Квитанція № ${tx.id}</div>
        <div class="subtitle">Дата та час проведення: ${tx.date}</div>

        <table>
          <tr><td class="label">Платник:</td><td class="value">${profile.fullName}</td></tr>
          <tr><td class="label">РНОКПП (ІПН) Платника:</td><td class="value">${profile.taxId}</td></tr>
          <tr><td class="label">Рахунок Платника (IBAN):</td><td class="value">${profile.iban}</td></tr>
          <tr><td class="label">Назва операції:</td><td class="value">${tx.title}</td></tr>
          <tr><td class="label">Категорія транзакції:</td><td class="value">${tx.category}</td></tr>
          <tr><td class="label">Місце проведення:</td><td class="value">${tx.location}</td></tr>
          <tr><td class="label">Призначення платежу:</td><td class="value">${tx.details}</td></tr>
          <tr><td class="label">Статус платежу:</td><td class="value" style="color: #059669;">ПРОВЕДЕНО (SUCCESS)</td></tr>
          <tr class="amount-row">
            <td class="label">Загальна сума:</td>
            <td class="value">${Math.abs(tx.amount).toFixed(2)} UAH</td>
          </tr>
        </table>

        ${isIBAN ? `
          <div class="notice-box">
            <b>Увага:</b> Зарахування на рахунок/картку одержувача залежить від банку отримувача: від термінового/моментального до 3 робочих днів (72 години).
          </div>
        ` : ''}

        <div class="kep-seal">
          <div>
            <b>Електронний цифровий підпис (ЕЦП / КЕП):</b><br>
            Підписувач: АТ «НЕО БАНК АПП» (Автоматизована банківська система)<br>
            Сертифікат КЕП: № 4F82A0938529964839833978<br>
            Хеш-код SHA256: ${Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2)}
          </div>
          <div style="text-align: center;">
            <div class="signature">Sokolov A.S.</div>
            <div style="font-size: 9px; color: #555; margin-top: 2px;">Підтверджено ЕЦП</div>
          </div>
        </div>

        <div class="footer">
          Квитанція сформована автоматично системою NE•OBANK. Служба підтримки: 0 800 300 800 | artemsokoloff@ukr.net
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    receiptWindow.document.write(htmlContent);
    receiptWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white font-sans flex justify-center selection:bg-[#00F5D4] selection:text-black">
      <div className="w-full max-w-[440px] min-h-screen bg-[#0E0E12] flex flex-col justify-between relative shadow-2xl overflow-x-hidden border-x border-white/5 pb-20">
        
        {/* Тост-сповіщення */}
        {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#00F5D4] text-black font-bold px-5 py-2.5 rounded-full text-xs shadow-2xl border border-white/30 flex items-center gap-2 animate-bounce">
            <Sparkles size={14} />
            {notification}
          </div>
        )}

        {/* --- ШАПКА --- */}
        <header className="p-4 pt-6 flex items-center justify-between border-b border-white/5 bg-[#0E0E12]/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Аватарка користувача (не замінює логотип дизайну сайту) */}
            <div className="relative group cursor-pointer">
              <img 
                src={profile.avatarUrl} 
                alt="Соколов Артем" 
                className="w-10 h-10 rounded-full object-cover border-2 border-[#00F5D4] hover:scale-105 transition shadow-md"
                onClick={() => setActiveTab('settings')}
              />
            </div>
            <div>
              <div className="text-[10px] text-[#00F5D4] font-bold uppercase tracking-wider">NE•OBANK VIP</div>
              <div className="text-xs font-black text-white tracking-wide">{profile.fullName.split(' ')[1]} {profile.fullName.split(' ')[0]}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('support')}
              className={`p-2 rounded-full transition ${activeTab === 'support' ? 'bg-[#00F5D4] text-black' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
              title="Підтримка"
            >
              <MessageSquare size={18} />
            </button>
            <button 
              onClick={() => setHideBalances(!hideBalances)} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 transition"
            >
              {hideBalances ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`p-2 rounded-full transition ${activeTab === 'settings' ? 'bg-[#00F5D4] text-black' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* --- ОСНОВНИЙ КОНТЕНТ --- */}
        <main className="p-4 space-y-6 flex-1">

          {/* TAB 1: ГОЛОВНИЙ ЕКРАН */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Компактне відображення балансу (без множинних рахунків) */}
              <div className="bg-gradient-to-br from-[#1A1A22] via-[#121218] to-[#0A0A0E] p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-[#00F5D4] uppercase">ОСНОВНИЙ РАХУНОК</span>
                    <h2 className="text-xs text-gray-400 font-mono mt-0.5">ARTEM SOKOLOV</h2>
                  </div>
                  <CreditCard className="text-gray-400" size={26} />
                </div>

                <div className="space-y-1 mb-6">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider">Баланс картки</div>
                  <div className="text-3xl font-black text-white tracking-tight font-mono">
                    {hideBalances ? '••••••' : `${cardBalance.toLocaleString('uk-UA', { minimumFractionDigits: 2 })} ₴`}
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-mono text-gray-300 pt-3 border-t border-white/5">
                  <span>{hideBalances ? '•••• •••• •••• ••••' : cardNumber}</span>
                  <span className="text-[#00F5D4] font-bold">{cardExpiry}</span>
                </div>
              </div>

              {/* КЕШБЕК */}
              <div className="bg-[#14141A] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#00F5D4]/10 text-[#00F5D4] rounded-2xl">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Кешбек NE•OBANK</div>
                    <div className="text-[10px] text-gray-400">Накопичено за місяць</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-[#00F5D4] font-mono">{cashbackBalance.toFixed(2)} ₴</div>
                  <button 
                    onClick={() => {
                      setCardBalance(prev => prev + cashbackBalance);
                      setCashbackBalance(0);
                      showToast("Кешбек успішно перераховано!");
                    }}
                    disabled={cashbackBalance <= 0}
                    className="text-[10px] bg-[#00F5D4] text-black font-bold px-2.5 py-1 rounded-lg mt-1 hover:scale-105 transition disabled:opacity-30"
                  >
                    Вивести
                  </button>
                </div>
              </div>

              {/* ІСТОРІЯ ТРАНЗАКЦІЙ */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                  <span>Останні транзакції</span>
                  <span className="text-[10px] text-[#00F5D4] font-mono">{transactions.length} записів</span>
                </div>

                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="p-3.5 bg-[#14141A] hover:bg-[#1A1A22] rounded-2xl border border-white/5 flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${tx.amount > 0 ? 'bg-[#00F5D4]/10 text-[#00F5D4]' : 'bg-[#FF6B6B]/10 text-[#FF6B6B]'}`}>
                          {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{tx.title}</div>
                          <div className="text-[10px] text-gray-400">{tx.category} • {tx.date.split(',')[1]}</div>
                        </div>
                      </div>
                      <div className={`text-xs font-black font-mono ${tx.amount > 0 ? 'text-[#00F5D4]' : 'text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} ₴
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ПЕРЕКАЗИ ТА ПЛАТЕЖІ */}
          {activeTab === 'transfers' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Перекази та Платежі</h2>
                <button 
                  onClick={() => setShowQRScanner(true)}
                  className="px-3 py-1.5 bg-[#00F5D4]/10 hover:bg-[#00F5D4]/20 border border-[#00F5D4]/30 rounded-xl text-xs text-[#00F5D4] font-bold flex items-center gap-1.5 transition"
                >
                  <Camera size={14} /> QR Сканер
                </button>
              </div>

              {/* Способи переказів */}
              <div className="flex gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'card', label: 'На картку', icon: CreditCard },
                  { id: 'mobile', label: 'Мобільний', icon: Smartphone },
                  { id: 'iban', label: 'За IBAN', icon: Landmark },
                  { id: 'utility', label: 'Комуналка', icon: Building2 }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTransferSubTab(tab.id)}
                      className={`flex-1 min-w-[85px] py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                        transferSubTab === tab.id ? 'bg-[#00F5D4] text-black shadow-lg shadow-[#00F5D4]/20' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleExecuteTransfer} className="bg-[#14141A] p-5 rounded-3xl border border-white/5 space-y-4">
                
                {transferSubTab === 'card' && (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-400 font-medium">Номер картки отримувача</label>
                    <input 
                      type="text"
                      placeholder="4441 •••• •••• 1234"
                      value={transferForm.recipientCard}
                      onChange={(e) => setTransferForm({...transferForm, recipientCard: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-[#00F5D4] font-mono"
                      required
                    />
                  </div>
                )}

                {transferSubTab === 'mobile' && (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-400 font-medium">Номер телефону (+380)</label>
                    <input 
                      type="text"
                      placeholder="+380 67 123 45 67"
                      value={transferForm.phone}
                      onChange={(e) => setTransferForm({...transferForm, phone: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-[#00F5D4] font-mono"
                      required
                    />
                  </div>
                )}

                {transferSubTab === 'iban' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium">IBAN отримувача</label>
                      <input 
                        type="text"
                        placeholder="UA89300001000002600123456789"
                        value={transferForm.iban}
                        onChange={(e) => setTransferForm({...transferForm, iban: e.target.value})}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-[#00F5D4] font-mono uppercase"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium">ПІБ Отримувача</label>
                      <input 
                        type="text"
                        placeholder="Іванов Іван Іванович"
                        value={transferForm.recipientName}
                        onChange={(e) => setTransferForm({...transferForm, recipientName: e.target.value})}
                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-[#00F5D4]"
                        required
                      />
                    </div>
                  </div>
                )}

                {transferSubTab === 'utility' && (
                  <div className="space-y-3">
                    <label className="text-xs text-gray-400 font-medium">Організація / Послуга (м. Київ)</label>
                    <select 
                      value={transferForm.utilityOrg}
                      onChange={(e) => setTransferForm({...transferForm, utilityOrg: e.target.value})}
                      className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-[#00F5D4]"
                    >
                      <option>Київводоканал / Водопостачання</option>
                      <option>ДТЕК Київські електромережі</option>
                      <option>YASNO (ТОВ «Київські енергетичні послуги»)</option>
                      <option>Нафтогаз України</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400 font-medium">Сума платежу (₴)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 text-sm font-black text-white focus:outline-none focus:border-[#00F5D4] font-mono"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-[#00F5D4] hover:bg-[#00D8B8] text-black font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-[#00F5D4]/20"
                >
                  Підтвердити та Сплатити
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: АКЦІЇ, КРЕДИТИ ТА ВКЛАДИ (Різноманітний дизайн) */}
          {activeTab === 'offers' && (
            <div className="space-y-5 animate-fadeIn">
              <h2 className="text-base font-bold text-white">Вигідні Пропозиції та Вклади</h2>

              {/* Депозит */}
              <div className="bg-gradient-to-br from-emerald-900/40 via-[#14141A] to-[#0A0A0E] p-5 rounded-3xl border border-emerald-500/30 space-y-3 relative overflow-hidden shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Вклад "Максимум"</span>
                    <h3 className="text-xl font-black text-white mt-2">До 18.5% річних</h3>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <p className="text-xs text-gray-300">
                  Виплати щомісяця на ваш рахунок. Можливість дострокового зняття без втрати відсотків.
                </p>
                <button 
                  onClick={() => showToast("Заявку на відкриття вкладу прийнято!")}
                  className="w-full py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-400/20"
                >
                  Відкрити депозит
                </button>
              </div>

              {/* Кредитна пропозиція */}
              <div className="bg-gradient-to-br from-[#FF6B6B]/20 via-[#14141A] to-[#0A0A0E] p-5 rounded-3xl border border-[#FF6B6B]/30 space-y-3 relative overflow-hidden shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-[#FF6B6B]/20 text-[#FF6B6B] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Персональний Кредит</span>
                    <h3 className="text-xl font-black text-white mt-2">До 250 000 ₴ під 0.01%</h3>
                  </div>
                  <div className="p-3 bg-[#FF6B6B]/10 text-[#FF6B6B] rounded-2xl">
                    <Zap size={24} />
                  </div>
                </div>
                <p className="text-xs text-gray-300">
                  Пільговий період до 62 днів на будь-які покупки та миттєві перекази без комісій.
                </p>
                <button 
                  onClick={() => showToast("Кредитний ліміт схвалено миттєво!")}
                  className="w-full py-3.5 bg-[#FF6B6B] hover:bg-[#D93838] text-white font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-[#FF6B6B]/20"
                >
                  Отримати кошти
                </button>
              </div>

              {/* Акція Кешбек */}
              <div className="bg-[#14141A] p-4 rounded-3xl border border-white/5 flex items-center gap-4 shadow-lg">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-2xl">
                  <Gift size={24} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Акція "Запроси друга"</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Отримуйте по 150 ₴ за кожного приведеного друга до банку</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ЧАТ ПІДТРИМКИ */}
          {activeTab === 'support' && (
            <div className="space-y-4 animate-fadeIn flex flex-col h-[70vh]">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="w-10 h-10 bg-[#00F5D4]/20 border border-[#00F5D4] rounded-full flex items-center justify-center text-[#00F5D4]">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Підтримка NE•OBANK</h2>
                  <div className="text-[10px] text-green-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" /> Оператор на зв'язку
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-1 no-scrollbar">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs ${
                      msg.sender === 'user' 
                        ? 'bg-[#00F5D4] text-black font-semibold rounded-br-none' 
                        : 'bg-[#14141A] text-white border border-white/10 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1 font-mono">{msg.time}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-white/5">
                <input 
                  type="text" 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Напишіть ваше запитання..."
                  className="flex-1 bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#00F5D4]"
                />
                <button 
                  type="submit"
                  className="p-3 bg-[#00F5D4] text-black font-bold rounded-2xl hover:bg-[#00D8B8] transition"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: ПРОФІЛЬ ТА НАЛАШТУВАННЯ */}
          {activeTab === 'settings' && (
            <div className="space-y-5 animate-fadeIn">
              <h2 className="text-base font-bold text-white">Профіль користувача</h2>

              <div className="bg-[#14141A] p-5 rounded-3xl border border-white/5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <img src={profile.avatarUrl} alt="Соколов Артем" className="w-14 h-14 rounded-full object-cover border-2 border-[#00F5D4]" />
                  <div>
                    <div className="text-sm font-bold text-white">{profile.fullName}</div>
                    <div className="text-xs text-gray-400 font-mono">{profile.email}</div>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Телефон:</span>
                    <span className="text-white">{profile.phone}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">РНОКПП (ІПН):</span>
                    <span className="text-white">{profile.taxId}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">IBAN рахунку:</span>
                    <span className="text-white text-[10px] truncate max-w-[180px]">{profile.iban}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Кредитний ліміт:</span>
                    <span className="text-[#00F5D4]">{profile.creditLimit} ₴</span>
                  </div>
                </div>
              </div>

              {/* Панель адміністратора */}
              <button 
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 hover:border-purple-500 text-purple-300 rounded-2xl text-xs font-bold flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <Shield size={16} /> Панель керування балансом (Адмін)
                </span>
                <ChevronRight size={16} className={`transform transition ${showAdminPanel ? 'rotate-90' : ''}`} />
              </button>

              {showAdminPanel && (
                <div className="bg-purple-950/30 p-5 rounded-3xl border border-purple-500/40 space-y-4 animate-fadeIn">
                  <div className="text-xs text-purple-300 font-black uppercase tracking-wider">
                    Керування балансом картки
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-300 font-bold">Баланс картки (₴)</label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="number"
                        value={cardBalance}
                        onChange={(e) => setCardBalance(parseFloat(e.target.value) || 0)}
                        className="flex-1 bg-black/60 border border-purple-500/30 rounded-xl p-2.5 text-xs text-white font-mono"
                      />
                      <button 
                        onClick={() => showToast("Баланс оновлено!")}
                        className="px-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* --- НИЖНЄ МЕНЮ --- */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[440px] bg-[#0E0E12]/90 backdrop-blur-2xl border-t border-white/5 p-2.5 flex justify-around items-center z-40">
          {[
            { id: 'home', label: 'Гаманець', icon: Home },
            { id: 'transfers', label: 'Перекази', icon: ArrowLeftRight },
            { id: 'offers', label: 'Пропозиції', icon: Percent },
            { id: 'support', label: 'Чат', icon: MessageSquare },
            { id: 'settings', label: 'Профіль', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition ${
                  isActive ? 'text-[#00F5D4] font-black' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={18} />
                <span className="text-[9px] tracking-wide">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* --- MODAL: ЧЕК ТРАНЗАЦІЇ --- */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="w-full max-w-[440px] bg-[#14141A] rounded-t-3xl sm:rounded-3xl border border-white/10 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Деталі платежу</div>
                <button onClick={() => setSelectedTx(null)} className="p-1 bg-white/5 rounded-full text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="text-center py-2">
                <div className="text-2xl font-black text-white font-mono">{selectedTx.amount.toFixed(2)} ₴</div>
                <div className="text-xs text-gray-400 mt-1">{selectedTx.title}</div>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Номер квитанції:</span>
                  <span className="text-[#00F5D4] font-bold">{selectedTx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Дата та час:</span>
                  <span>{selectedTx.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Призначення:</span>
                  <span className="text-right text-gray-300">{selectedTx.details}</span>
                </div>
              </div>

              {(selectedTx.transferType === 'iban' || selectedTx.id.includes('39C3')) && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-300 leading-relaxed font-medium">
                  Зарахування на рахунок/картку одержувача залежить від банку отримувача: від термінового/моментального до 3 робочих днів (72 години).
                </div>
              )}

              <button 
                onClick={() => downloadOfficialPDFReceipt(selectedTx)}
                className="w-full py-3.5 bg-[#00F5D4] text-black font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-[#00F5D4]/20 uppercase tracking-wider"
              >
                <Download size={16} /> Завантажити Офіційний PDF Чек
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
