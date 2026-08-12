import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, ShieldAlert, Copy, Check, Snowflake, Edit3, Lock } from 'lucide-react';
import { cn, formatUAH } from '../lib/utils';

interface TurquoiseCardProps {
  cardNumber: string;
  cardHolder: string;
  cvv: string;
  expiryDate: string;
  iban: string;
  balance: number;
  creditLimit: number;
  isFrozen: boolean;
  showBalance?: boolean;
  onToggleFreeze: () => void;
  onToggleShowBalance?: () => void;
  onOpenEditBalance?: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
  secretModeEnabled: boolean;
}

export function TurquoiseCard({
  cardNumber,
  cardHolder,
  cvv,
  expiryDate,
  iban,
  balance,
  creditLimit,
  isFrozen,
  showBalance = true,
  onToggleFreeze,
  onToggleShowBalance,
  onOpenEditBalance,
  showToast,
  secretModeEnabled
}: TurquoiseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  const handleCopyIban = () => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    showToast('Ne•OBank App', 'IBAN скопійовано в буфер обміну', 'success');
    setTimeout(() => setCopiedIban(false), 2000);
  };

  return (
    <div className="space-y-3 font-sans">
      {/* Interactive Card with Sharp, Strict, Tender-Cream Neo-brutalist styling */}
      <div 
        className={cn(
          "relative rounded-none p-5 border-2 border-black transition-all duration-200 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          isFrozen 
            ? "bg-[#F1F5F9] text-slate-400 opacity-90"
            : "bg-white text-black"
        )}
      >
        {/* Soft elegant gradient tint for tenderness */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-sky-100/50 rounded-none pointer-events-none transform rotate-45 translate-x-20 -translate-y-20"></div>

        {/* Frozen Badge Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs z-20 flex flex-col items-center justify-center space-y-2">
            <div className="p-2.5 border-2 border-black bg-[#FEF2F2] text-red-600 font-bold text-xs uppercase tracking-wider">
              <Snowflake className="w-5 h-5 inline-block mr-1.5 align-middle" />
              Картку заморожено
            </div>
            <button 
              onClick={onToggleFreeze}
              className="px-4 py-1.5 border-2 border-black bg-black text-white hover:bg-slate-800 text-xs font-bold transition rounded-none uppercase tracking-wider"
            >
              Розморозити
            </button>
          </div>
        )}

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-black flex items-center justify-center font-black text-white text-sm">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-black block leading-none">Ne•OBank App</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">Luxury Premium Platinum</span>
            </div>
          </div>
          
          {secretModeEnabled && (
            <div className="flex items-center space-x-1.5">
              {onToggleShowBalance && (
                <button 
                  onClick={onToggleShowBalance}
                  title="Сховати / Показати баланс"
                  className="p-1.5 bg-white border border-black hover:bg-slate-50 text-black transition-all flex items-center justify-center"
                >
                  {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              )}
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="p-1.5 bg-black text-white hover:bg-slate-800 transition-all text-xs flex items-center space-x-1 px-2.5 font-bold uppercase tracking-wider"
              >
                {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showDetails ? 'Сховати' : 'Деталі'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Chip & Balance */}
        <div className="my-5 relative z-10 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-600 block uppercase tracking-wider font-extrabold">Баланс Картки</span>
              {secretModeEnabled && onOpenEditBalance && (
                <button
                  onClick={onOpenEditBalance}
                  className="p-1 border border-black bg-[#F0FDF4] hover:bg-[#DCFCE7] text-green-800 transition text-[9px] flex items-center space-x-1 px-2 font-bold uppercase tracking-widest"
                  title="Змінити баланс"
                >
                  <Edit3 className="w-2.5 h-2.5" />
                  <span>Змінити</span>
                </button>
              )}
            </div>
            
            <div 
              onClick={secretModeEnabled ? onOpenEditBalance : undefined}
              className={cn(
                "text-2xl font-black tracking-tight text-black flex items-baseline select-all",
                secretModeEnabled && "cursor-pointer hover:text-slate-700 transition"
              )}
            >
              {secretModeEnabled ? (
                showBalance ? formatUAH(balance) : "•••••••• ₴"
              ) : (
                <span className="text-slate-400 font-bold text-lg uppercase tracking-wider">ПРИВАТНИЙ РЕЖИМ</span>
              )}
            </div>
          </div>

          <div className="w-9 h-6 border border-black bg-amber-100 flex items-center justify-center">
            <div className="w-4 h-3 border-r border-black"></div>
          </div>
        </div>

        {/* Card Number & Holder */}
        <div className="space-y-1.5 relative z-10 pt-3.5 border-t border-black">
          <div className="flex justify-between items-center text-xs font-mono text-black font-semibold tracking-wider">
            {secretModeEnabled ? (
              <span>{showDetails ? cardNumber : `•••• •••• •••• ${cardNumber.slice(-4)}`}</span>
            ) : (
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest flex items-center">
                <Lock className="w-3 h-3 mr-1" /> Дані приховано
              </span>
            )}
            
            {secretModeEnabled ? (
              <span className="text-[11px] text-slate-700 font-bold">{showDetails ? expiryDate : '••/••'}</span>
            ) : (
              <span className="text-slate-400 text-[11px] font-bold">••/••</span>
            )}
          </div>

          <div className="flex justify-between items-center pt-0.5 text-[10px]">
            <span className="font-extrabold text-black uppercase tracking-widest">
              {secretModeEnabled ? cardHolder : "КЛІЄНТ БАНКУ"}
            </span>
            {secretModeEnabled && showDetails && (
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 border border-black text-black font-bold">
                CVV: {cvv}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Controls Grid */}
      {secretModeEnabled && (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={handleCopyIban}
            className="p-2.5 rounded-none bg-white hover:bg-slate-50 border-2 border-black flex items-center justify-between text-left transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-extrabold">Копіювати IBAN</span>
              <span className="text-xs font-bold text-black truncate max-w-[125px] block font-mono">
                {iban.slice(0, 10)}...
              </span>
            </div>
            <div className="p-1 border border-black bg-slate-50 text-black">
              {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </div>
          </button>

          <button 
            onClick={onToggleFreeze}
            className={cn(
              "p-2.5 rounded-none border-2 border-black flex items-center justify-between text-left transition shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]",
              isFrozen 
                ? "bg-red-50 text-red-800" 
                : "bg-white hover:bg-slate-50 text-black"
            )}
          >
            <div>
              <span className="text-[9px] text-slate-500 block uppercase font-extrabold">Статус Картки</span>
              <span className="text-xs font-bold block uppercase tracking-wider">
                {isFrozen ? 'Заморожено' : 'Активна'}
              </span>
            </div>
            <div className="p-1 border border-black bg-slate-50 text-black">
              <Snowflake className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
