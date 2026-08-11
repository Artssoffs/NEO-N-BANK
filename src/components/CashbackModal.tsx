import React from 'react';
import { Gift, CheckCircle2, ArrowUpRight, X, ShoppingBag, Utensils, Fuel, HeartPulse, Home, Smile } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface CashbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
}

const iconMap: Record<string, React.ReactNode> = {
  ShoppingBag: <ShoppingBag className="w-5 h-5 text-cyan-400" />,
  Utensils: <Utensils className="w-5 h-5 text-amber-400" />,
  Fuel: <Fuel className="w-5 h-5 text-rose-400" />,
  HeartPulse: <HeartPulse className="w-5 h-5 text-emerald-400" />,
  Home: <Home className="w-5 h-5 text-blue-400" />,
  Smile: <Smile className="w-5 h-5 text-purple-400" />,
};

export function CashbackModal({ isOpen, onClose, showToast }: CashbackModalProps) {
  const { user, cashbackCategories, toggleCashbackCategory, withdrawCashback } = useStore();

  if (!isOpen) return null;

  const selectedCount = cashbackCategories.filter(c => c.selected).length;
  const cashbackFormatted = (user.cashbackBalance / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleWithdraw = () => {
    if (user.cashbackBalance <= 0) {
      showToast('Кешбек НЕ-ОБАНК', 'Баланс кешбеку порожній', 'error');
      return;
    }
    const success = withdrawCashback();
    if (success) {
      showToast('НЕ-ОБАНК', `Кешбек у сумі ${cashbackFormatted} ₴ успішно перераховано на картку!`, 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F172A] border border-cyan-500/30 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-cyan-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold">
              <Gift className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Кешбек НЕ-ОБАНК</h3>
              <p className="text-[10px] text-cyan-200/60">Оберіть 2 категорії на цей місяць</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cashback Accumulated Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/80 via-cyan-900/40 to-slate-900 border border-cyan-400/30 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-cyan-200/70 uppercase font-medium block">Накопичений Кешбек</span>
            <div className="text-2xl font-black text-white tracking-tight">
              {cashbackFormatted} <span className="text-cyan-300 text-sm">₴</span>
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={user.cashbackBalance <= 0}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1",
              user.cashbackBalance > 0
                ? "bg-cyan-400 text-black hover:bg-cyan-300 shadow-lg shadow-cyan-500/20 active:scale-95"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
          >
            <span>Вивести</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Categories grid */}
        <div>
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-bold text-white">Категорії ({selectedCount}/2 обрано)</span>
            {selectedCount >= 2 && (
              <span className="text-[10px] text-cyan-300 font-medium">Максимум обрано</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {cashbackCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCashbackCategory(cat.id)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition relative flex flex-col justify-between space-y-2",
                  cat.selected
                    ? "bg-cyan-950/60 border-cyan-400 text-white shadow-md shadow-cyan-500/10"
                    : "bg-black/30 border-cyan-500/15 text-white/70 hover:bg-black/50"
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-xl bg-black/40">
                    {iconMap[cat.iconName] || <Gift className="w-5 h-5 text-cyan-400" />}
                  </div>
                  <span className="text-xs font-black text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/30">
                    +{cat.percent}%
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold block leading-tight">{cat.name}</span>
                </div>

                {cat.selected && (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 absolute top-2 right-2" />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
