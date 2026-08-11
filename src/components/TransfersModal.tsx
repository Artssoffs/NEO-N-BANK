import React, { useState } from 'react';
import { CreditCard, Smartphone, Landmark, Receipt, X, ArrowRight, CheckCircle2, Scan } from 'lucide-react';
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
  const [utilityCompany, setUtilityCompany] = useState('Київводоканал / ДТЕК');

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
    showToast('NEO-N•BANK', 'Реквізити автоматично заповнено з QR-коду!', 'success');
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Math.round(parseFloat(amountStr.replace(',', '.')) * 100);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('НЕ-ОБАНК', 'Введіть коректну суму', 'error');
      return;
    }

    if (user.balance < parsedAmount) {
      showToast('НЕ-ОБАНК', 'Недостатньо коштів на картці НЕ-ОБАНК', 'error');
      return;
    }

    let title = '';
    let category = '';

    if (activeType === 'card') {
      title = `Переказ на картку ${targetNumber.slice(-4) || '****'}`;
      category = 'Переказ P2P';
    } else if (activeType === 'mobile') {
      title = `Поповнення мобільного ${targetNumber}`;
      category = 'Мобільний зв\'язок';
    } else if (activeType === 'iban') {
      title = `Переказ за IBAN ${targetNumber.slice(0, 8)}...`;
      category = 'Оплата за реквізитами';
    } else {
      title = `Оплата послуг: ${utilityCompany}`;
      category = 'Комунальні платежі';
    }

    addTransaction({
      type: 'expense',
      amount: parsedAmount,
      title,
      category,
      description: comment || 'Платіж проведено через Ne-OBank App',
      status: 'success',
      isCash: false,
      paymentMethod: 'sense_card'
    });

    showToast('НЕ-ОБАНК', `Успішно сплачено ${(parsedAmount / 100).toFixed(2)} ₴`, 'success');
    setTargetNumber('');
    setAmountStr('');
    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F172A] border border-cyan-500/30 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-cyan-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              💸
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Перекази & Платежі</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              title="Сканувати QR або штрихкод платіжки"
            >
              <Scan className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>QR / Штрихкод</span>
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transfer Category Selector */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-2xl border border-cyan-500/20">
          <button
            type="button"
            onClick={() => setActiveType('card')}
            className={cn(
              "py-2 rounded-xl text-[10px] font-bold transition flex flex-col items-center justify-center space-y-1",
              activeType === 'card' ? "bg-cyan-500 text-black shadow-md" : "text-cyan-200/70 hover:text-white"
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>На картку</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('mobile')}
            className={cn(
              "py-2 rounded-xl text-[10px] font-bold transition flex flex-col items-center justify-center space-y-1",
              activeType === 'mobile' ? "bg-cyan-500 text-black shadow-md" : "text-cyan-200/70 hover:text-white"
            )}
          >
            <Smartphone className="w-4 h-4" />
            <span>Мобільний</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('iban')}
            className={cn(
              "py-2 rounded-xl text-[10px] font-bold transition flex flex-col items-center justify-center space-y-1",
              activeType === 'iban' ? "bg-cyan-500 text-black shadow-md" : "text-cyan-200/70 hover:text-white"
            )}
          >
            <Landmark className="w-4 h-4" />
            <span>IBAN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveType('utility')}
            className={cn(
              "py-2 rounded-xl text-[10px] font-bold transition flex flex-col items-center justify-center space-y-1",
              activeType === 'utility' ? "bg-cyan-500 text-black shadow-md" : "text-cyan-200/70 hover:text-white"
            )}
          >
            <Receipt className="w-4 h-4" />
            <span>Комуналка</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleExecuteTransfer} className="space-y-3 pt-1">
          {activeType === 'card' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-cyan-200/80 font-medium">Номер картки отримувача</label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center space-x-1 font-bold"
                >
                  <Scan className="w-3 h-3 text-cyan-400" />
                  <span>Зчитати з QR</span>
                </button>
              </div>
              <input 
                type="text"
                placeholder="4441 •••• •••• 1234"
                maxLength={19}
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                required
                className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {activeType === 'mobile' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-cyan-200/80 font-medium">Номер телефону (+380)</label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center space-x-1 font-bold"
                >
                  <Scan className="w-3 h-3 text-cyan-400" />
                  <span>Сканувати</span>
                </button>
              </div>
              <input 
                type="tel"
                placeholder="+380 67 123 45 67"
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                required
                className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 text-sm font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {activeType === 'iban' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-cyan-200/80 font-medium">Номер рахунку IBAN</label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[10px] text-cyan-300 hover:text-cyan-200 flex items-center space-x-1 font-bold"
                >
                  <Scan className="w-3 h-3 text-cyan-400" />
                  <span>Сканувати QR платіжки</span>
                </button>
              </div>
              <input 
                type="text"
                placeholder="UA89 3000 0000 ..."
                value={targetNumber}
                onChange={(e) => setTargetNumber(e.target.value)}
                required
                className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-white placeholder-white/30 text-sm font-mono uppercase focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {activeType === 'utility' && (
            <div>
              <label className="text-[11px] text-cyan-200/80 font-medium block mb-1">Організація / Послуга</label>
              <select 
                value={utilityCompany}
                onChange={(e) => setUtilityCompany(e.target.value)}
                className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="Київводоканал / Водопостачання">Київводоканал / Водопостачання</option>
                <option value="ДТЕК Київські електромережі">ДТЕК Київські електромережі</option>
                <option value="Нафтогаз України">Нафтогаз України</option>
                <option value="Інтернет Ланет / Воля / Укртелеком">Інтернет & ТБ (Укртелеком / Volia)</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] text-cyan-200/80 font-medium block mb-1">Сума платежу (₴)</label>
            <input 
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              required
              className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3.5 py-2.5 text-cyan-300 font-bold text-lg placeholder-white/20 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-[11px] text-cyan-200/80 font-medium block mb-1">Коментар до платежу (необов'язково)</label>
            <input 
              type="text"
              placeholder="Наприклад: Подарунок або Поповнення"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-black/50 border border-cyan-500/30 rounded-xl px-3.5 py-2 text-white placeholder-white/30 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-black font-extrabold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition active:scale-95"
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
