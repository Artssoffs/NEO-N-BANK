import React, { useState, useEffect } from 'react';
import { X, Save, Wallet, CreditCard, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import { formatUAH } from '../lib/utils';

interface QuickBalanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
}

export function QuickBalanceEditModal({ isOpen, onClose, showToast }: QuickBalanceEditModalProps) {
  const { user, setCardBalanceInHryvnias } = useStore();
  
  const [cardInputValue, setCardInputValue] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setCardInputValue(((user.balance || 0) / 100).toFixed(2));
    }
  }, [isOpen, user.balance]);

  if (!isOpen) return null;

  const numericCardVal = parseFloat(cardInputValue.replace(',', '.')) || 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numericCardVal) || numericCardVal < 0) {
      showToast('Помилка', 'Введіть коректну суму балансу картки', 'error');
      return;
    }

    setCardBalanceInHryvnias(numericCardVal);

    showToast(
      'NEO•N•BANK',
      `Баланс успішно оновлено: ${formatUAH(Math.round(numericCardVal * 100))}`,
      'success'
    );
    onClose();
  };

  const applyPreset = (amount: number, isAdd = false) => {
    const current = isAdd ? numericCardVal + amount : amount;
    setCardInputValue(current.toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-t-3xl sm:rounded-3xl p-5 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Керування Балансом
              </h3>
              <p className="text-[10px] text-zinc-500">
                Адміністративне коригування суми на картці (₴)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-500 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider text-[9px]">
              Новий баланс картки (UAH ₴)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={cardInputValue}
                onChange={(e) => setCardInputValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3.5 pl-4 pr-12 text-xl font-mono font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition"
                autoFocus
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-cyan-400 font-sans">
                ₴
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 flex justify-between px-1">
              <span>Поточний баланс:</span>
              <span className="font-mono font-extrabold text-white">{formatUAH(user.balance)}</span>
            </div>
          </div>

          {/* Formatted Live Display */}
          <div className="p-3.5 rounded-2xl bg-cyan-400/10 border border-cyan-400/15 text-center space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-cyan-400/70 font-extrabold block">
              Нова сума на екрані
            </span>
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {formatUAH(Math.round(numericCardVal * 100))}
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 block font-bold uppercase tracking-wider">Швидкі пресети коригування:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(1000, true)}
                className="py-2 px-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-cyan-400/30 text-xs font-bold text-zinc-300 transition"
              >
                +1 000 ₴
              </button>
              <button
                type="button"
                onClick={() => applyPreset(5000, true)}
                className="py-2 px-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-cyan-400/30 text-xs font-bold text-zinc-300 transition"
              >
                +5 000 ₴
              </button>
              <button
                type="button"
                onClick={() => applyPreset(15000, true)}
                className="py-2 px-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-cyan-400/30 text-xs font-bold text-zinc-300 transition"
              >
                +15 000 ₴
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => applyPreset(0)}
                className="py-2 px-2 rounded-xl bg-red-950/20 border border-red-900/30 hover:border-red-500/30 text-xs font-bold text-red-400 transition"
              >
                Обнулити (0 ₴)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(50000)}
                className="py-2 px-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30 hover:border-emerald-500/30 text-xs font-bold text-emerald-400 transition"
              >
                Встановити 50к
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-400/10 flex items-center justify-center space-x-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Зберегти новий баланс</span>
          </button>
        </form>
      </div>
    </div>
  );
}
