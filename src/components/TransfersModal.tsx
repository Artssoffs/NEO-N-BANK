import React, { useState } from 'react';
import { CreditCard, Smartphone, Landmark, Receipt, X, ArrowRight, Scan, HelpCircle } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { QRScannerModal } from './QRScannerModal';
import { ScannedPaymentData } from '../lib/qrParser';

interface TransfersModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
}

export function TransfersModal({ isOpen, onClose, showToast }: TransfersModalProps) {
  const { user, addTransaction } = useStore();
  const [activeType, setActiveType] = useState<'card' | 'mobile' | 'iban' | 'utility'>('card');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  // Form states
  const [targetNumber, setTargetNumber] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [comment, setComment] = useState('');
  const [utilityCompany, setUtilityCompany] = useState('ТОВ «Київські енергетичні послуги» (YASNO)');

  // Extended IBAN states
  const [recipientName, setRecipientName] = useState('');
  const [recipientCode, setRecipientCode] = useState('');

  // Utility-specific dynamic fields
  const [utilityAccount, setUtilityAccount] = useState('');
  const [utilityFlat, setUtilityFlat] = useState('');
  const [utilityMeter1, setUtilityMeter1] = useState('');
  const [utilityMeter2, setUtilityMeter2] = useState('');

  if (!isOpen) return null;

  const handleScanSuccess = (scanned: ScannedPaymentData) => {
    setActiveType(scanned.type);
    setTargetNumber(scanned.targetNumber);
    if (scanned.amount) {
      setAmountStr(scanned.amount);
    }
    if (scanned.comment) {
      setComment(scanned.comment);
    }
    showToast('NEO•N•BANK', 'Реквізити автоматично заповнено з QR-коду!', 'success');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.round(parseFloat(amountStr.replace(',', '.')) * 100);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('NEO•N•BANK', 'Введіть коректну суму', 'error');
      return;
    }

    if (user.balance < parsedAmount) {
      showToast('NEO•N•BANK', 'Недостатньо коштів на вашій картці', 'error');
      return;
    }

    let title = '';
    let category = '';
    let desc = comment;

    if (activeType === 'card') {
      title = `Переказ на картку ${targetNumber.replace(/\s+/g, '').slice(-4) || '****'}`;
      category = 'Переказ P2P';
      if (!desc) desc = 'Переказ на картку через додаток';
    } else if (activeType === 'mobile') {
      title = `Поповнення мобільного ${targetNumber}`;
      category = 'Мобільний зв\'язок';
      if (!desc) desc = 'Миттєве поповнення рахунку';
    } else if (activeType === 'iban') {
      if (!recipientName || !recipientCode) {
        showToast('NEO•N•BANK', 'Заповніть ПІБ та ІПН отримувача', 'error');
        return;
      }
      title = `Переказ за IBAN отримувачу ${recipientName}`;
      category = 'Платіж за реквізитами';
      desc = `Отримувач: ${recipientName} (ІПН/ЄДРПОУ: ${recipientCode}). IBAN: ${targetNumber}. Призначення: ${comment || 'Оплата за послуги / товари'}`;
    } else {
      title = `${utilityCompany}`;
      category = 'Комунальні платежі';
      if (!desc) desc = `Сплата за комунальні послуги: ${utilityCompany}`;
    }

    addTransaction({
      type: 'expense',
      amount: parsedAmount,
      title,
      category,
      description: desc,
      status: 'success',
      isCash: false,
      paymentMethod: 'sense_card'
    });

    showToast('NEO•N•BANK', `Успішно сплачено ${(parsedAmount / 100).toFixed(2)} ₴`, 'success');
    
    // reset
    setTargetNumber('');
    setAmountStr('');
    setComment('');
    setRecipientName('');
    setRecipientCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 font-bold">
              💸
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-wider block">Платежі та перекази</h3>
              <span className="text-[9px] text-zinc-500 block">Швидкі розрахунки в межах України</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-400 hover:bg-zinc-800/80 text-[10px] font-black transition flex items-center space-x-1.5 tracking-wider uppercase"
              title="Сканувати QR або штрихкод платіжки"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>QR Сканер</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories navigation with smooth interactive active state */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900/60 rounded-xl border border-zinc-850">
          <button
            type="button"
            onClick={() => {
              setActiveType('card');
              setTargetNumber('');
            }}
            className={cn(
              "py-2.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider flex flex-col items-center justify-center space-y-1.5 duration-200",
              activeType === 'card' ? "bg-cyan-400 text-zinc-950 font-black shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>На картку</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('mobile');
              setTargetNumber('');
            }}
            className={cn(
              "py-2.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider flex flex-col items-center justify-center space-y-1.5 duration-200",
              activeType === 'mobile' ? "bg-cyan-400 text-zinc-950 font-black shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            <Smartphone className="w-4 h-4" />
            <span>Мобільний</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('iban');
              setTargetNumber('');
            }}
            className={cn(
              "py-2.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider flex flex-col items-center justify-center space-y-1.5 duration-200",
              activeType === 'iban' ? "bg-cyan-400 text-zinc-950 font-black shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            <Landmark className="w-4 h-4" />
            <span>За IBAN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('utility');
              setTargetNumber('');
            }}
            className={cn(
              "py-2.5 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider flex flex-col items-center justify-center space-y-1.5 duration-200",
              activeType === 'utility' ? "bg-cyan-400 text-zinc-950 font-black shadow-md" : "text-zinc-400 hover:text-white"
            )}
          >
            <Receipt className="w-4 h-4" />
            <span>Комуналка</span>
          </button>
        </div>

        {/* Dynamic Interactive Forms */}
        <form onSubmit={handleExecuteTransfer} className="space-y-3.5 pt-1">
          {activeType === 'card' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Номер картки отримувача</label>
              </div>
              <input 
                type="text"
                placeholder="4441 1144 8888 1234"
                maxLength={19}
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>
          )}

          {activeType === 'mobile' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Номер мобільного (+380)</label>
              </div>
              <input 
                type="tel"
                placeholder="+380 67 123 45 67"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
            </div>
          )}

          {activeType === 'iban' && (
            <div className="space-y-3 animate-fade-in">
              {/* Recipient Full Name */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">ПІБ отримувача (Повна назва)</label>
                <input 
                  type="text"
                  placeholder="ТОВ СИСТЕМНІ РІШЕННЯ або Петренко Петро Петрович"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Recipient IPN / USREOU */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">ІПН отримувача / Код ЄДРПОУ (через /)</label>
                <input 
                  type="text"
                  placeholder="3574503010 / 12345678"
                  value={recipientCode}
                  onChange={(e) => setRecipientCode(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Full IBAN */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Рахунок отримувача (IBAN)</label>
                </div>
                <input 
                  type="text"
                  placeholder="UA93 3052 9900 0002 6001 ..."
                  value={targetNumber}
                  onChange={(e) => setTargetNumber(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-xs font-mono uppercase focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {activeType === 'utility' && (
            <div>
              <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">Постачальник послуг (м. Київ)</label>
              <select 
                value={utilityCompany}
                onChange={(e) => setUtilityCompany(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="ДТЕК Київські електромережі (Електропостачання)">⚡ ДТЕК Київські електромережі (Електропостачання)</option>
                <option value="ПрАТ АК Київводоканал (Водопостачання)">💧 ПрАТ АК Київводоканал (Водопостачання & Водовідведення)</option>
                <option value="ТОВ ГК Нафтогаз України (Природний газ)">🔥 ТОВ ГК Нафтогаз України (Природний газ)</option>
                <option value="ТОВ Київські енергетичні послуги YASNO (Електроенергія)">💡 ТОВ Київські енергетичні послуги YASNO</option>
                <option value="КП Київтеплоенерго (Опалення & Гаряча вода)">🌡️ КП Київтеплоенерго (Опалення & Гаряча вода)</option>
                <option value="КП ГІОЦ Київ (Усі комунальні послуги за адресою)">🏢 КП ГІОЦ Київ (Єдина комунальна квитанція)</option>
                <option value="Інтернет & ТБ (Ланет / Воля-Кабель / Тріолан / Київстар)">🌐 Інтернет & ТБ (Ланет / Воля / Київстар / Тріолан)</option>
              </select>
            </div>
          )}

          {/* Amount input block */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">Сума платежу (₴)</label>
            <div className="relative flex items-center">
              <input 
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-cyan-400 font-extrabold text-lg placeholder-zinc-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
              />
              <span className="absolute right-4 font-black text-zinc-500 text-sm">UAH</span>
            </div>
          </div>

          {/* Comment / Purpose of payment */}
          <div>
            <label className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold block mb-1">Призначення платежу / Коментар</label>
            <input 
              type="text"
              placeholder={activeType === 'iban' ? "Оплата згідно договору або Надання фіндопомоги" : "Наприклад: Комуналка за липень, Подарунок тощо"}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-3 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-lg shadow-cyan-950 flex items-center justify-center space-x-2 active:scale-95"
          >
            <span>Підтвердити та Сплатити</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <QRScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          showToast={showToast}
        />
      </div>
    </div>
  );
}
