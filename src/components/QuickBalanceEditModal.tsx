import React, { useState, useEffect } from 'react';
import { X, Save, Wallet, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { formatUAH } from '../lib/utils';

interface QuickBalanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
}

export function QuickBalanceEditModal({ isOpen, onClose, showToast }: QuickBalanceEditModalProps) {
  const { user, setCardBalanceInHryvnias, setCashBalanceInHryvnias } = useStore();
  
  const [activeTab, setActiveTab] = useState<'card' | 'cash'>('card');
  const [cardInputValue, setCardInputValue] = useState<string>('');
  const [cashInputValue, setCashInputValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCardInputValue(((user.balance || 0) / 100).toFixed(2));
      setCashInputValue(((user.cashBalance || 0) / 100).toFixed(2));
    }
  }, [isOpen, user.balance, user.cashBalance]);

  if (!isOpen) return null;

  const numericCardVal = parseFloat(cardInputValue.replace(',', '.')) || 0;
  const numericCashVal = parseFloat(cashInputValue.replace(',', '.')) || 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numericCardVal) || numericCardVal < 0) {
      showToast('Помилка', 'Введіть коректну суму балансу картки', 'error');
      return;
    }
    if (isNaN(numericCashVal) || numericCashVal < 0) {
      showToast('Помилка', 'Введіть коректну суму готівкового балансу', 'error');
      return;
    }

    setCardBalanceInHryvnias(numericCardVal);
    setCashBalanceInHryvnias(numericCashVal);

    showToast(
      'Ne•OBank App',
      `Баланс успішно оновлено по всьому додатку: ${formatUAH(Math.round(numericCardVal * 100))}`,
      'success'
    );
    onClose();
  };

  const applyPreset = (amount: number, isAdd = false) => {
    if (activeTab === 'card') {
      const current = isAdd ? numericCardVal + amount : amount;
      setCardInputValue(current.toFixed(2));
    } else {
      const current = isAdd ? numericCashVal + amount : amount;
      setCashInputValue(current.toFixed(2));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0D1117] border border-violet-500/30 rounded-t-3xl sm:rounded-3xl p-5 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-violet-500/20 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-400/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Швидка зміна балансу (1-Click)
              </h3>
              <p className="text-[10px] text-violet-300/70">
                Глобальне оновлення суми в ₴ по всьому PWA
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#161B26] border border-violet-500/15">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeTab === 'card'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-violet-300/60 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Картка Ne•OBank</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cash')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
              activeTab === 'cash'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-violet-300/60 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Готівковий гаманець</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'card' ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-violet-200 block">
                Новий баланс картки (₴ / UAH)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cardInputValue}
                  onChange={(e) => setCardInputValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#161B26] border border-violet-500/30 rounded-2xl py-3.5 pl-4 pr-12 text-xl font-mono font-bold text-white focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-violet-300">
                  ₴
                </span>
              </div>
              <div className="text-[11px] text-violet-300/80 flex justify-between px-1">
                <span>Попередній баланс:</span>
                <span className="font-mono font-bold">{formatUAH(user.balance)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-violet-200 block">
                Новий готівковий баланс (₴ / UAH)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={cashInputValue}
                  onChange={(e) => setCashInputValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#161B26] border border-violet-500/30 rounded-2xl py-3.5 pl-4 pr-12 text-xl font-mono font-bold text-white focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition"
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-violet-300">
                  ₴
                </span>
              </div>
              <div className="text-[11px] text-violet-300/80 flex justify-between px-1">
                <span>Попередній баланс:</span>
                <span className="font-mono font-bold">{formatUAH(user.cashBalance)}</span>
              </div>
            </div>
          )}

          {/* Formatted Live Display */}
          <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-400/20 text-center space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-violet-300/70 font-semibold block">
              Попередній перегляд підсумкової суми
            </span>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatUAH(Math.round((activeTab === 'card' ? numericCardVal : numericCashVal) * 100))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-violet-300/70 block font-medium">Швидкі пресети для {activeTab === 'card' ? 'картки' : 'готівки'}:</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(1000, true)}
                className="py-1.5 px-2 rounded-xl bg-[#161B26] border border-violet-500/20 hover:border-violet-400/50 text-[11px] font-bold text-violet-200 transition"
              >
                +1 000 ₴
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5000, true)}
                className="py-1.5 px-2 rounded-xl bg-[#161B26] border border-violet-500/20 hover:border-violet-400/50 text-[11px] font-bold text-violet-200 transition"
              >
                +5 000 ₴
              </button>
              <button
                type="button"
                onClick={() => applyPreset(10000, true)}
                className="py-1.5 px-2 rounded-xl bg-[#161B26] border border-violet-500/20 hover:border-violet-400/50 text-[11px] font-bold text-violet-200 transition"
              >
                +10 000 ₴
              </button>
              <button
                type="button"
                onClick={() => applyPreset(50000, false)}
                className="py-1.5 px-2 rounded-xl bg-[#161B26] border border-violet-500/20 hover:border-violet-400/50 text-[11px] font-bold text-violet-200 transition"
              >
                50 000 ₴
              </button>
              <button
                type="button"
                onClick={() => applyPreset(100000, false)}
                className="py-1.5 px-2 rounded-xl bg-[#161B26] border border-violet-500/20 hover:border-violet-400/50 text-[11px] font-bold text-violet-200 transition"
              >
                100 000 ₴
              </button>
              <button
                type="button"
                onClick={() => applyPreset(250000, false)}
                className="py-1.5 px-2 rounded-xl bg-[#161B26] border border-violet-500/20 hover:border-violet-400/50 text-[11px] font-bold text-violet-200 transition"
              >
                250 000 ₴
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-black text-xs shadow-lg shadow-violet-500/30 flex items-center justify-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>Зберегти та оновити</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
