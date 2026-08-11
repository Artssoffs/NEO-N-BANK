import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, ShieldAlert, Copy, Check, Snowflake } from 'lucide-react';
import { cn } from '../lib/utils';

interface TurquoiseCardProps {
  cardNumber: string;
  cardHolder: string;
  cvv: string;
  expiryDate: string;
  iban: string;
  balance: number;
  creditLimit: number;
  isFrozen: boolean;
  onToggleFreeze: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info' | 'push') => void;
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
  onToggleFreeze,
  showToast
}: TurquoiseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);

  const handleCopyIban = () => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    showToast('НЕ-ОБАНК', 'IBAN скопійовано в буфер обміну', 'success');
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const formattedBalance = (balance / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedLimit = (creditLimit / 100).toLocaleString('uk-UA');

  return (
    <div className="space-y-3">
      {/* Interactive Card */}
      <div 
        className={cn(
          "relative rounded-3xl p-5 border transition-all duration-300 overflow-hidden shadow-2xl group",
          isFrozen 
            ? "bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#020617] border-cyan-500/30 opacity-90"
            : "bg-gradient-to-br from-[#082F49] via-[#0E7490] to-[#0A101D] border-cyan-400/40 shadow-cyan-500/10"
        )}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-400/20 rounded-full filter blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-teal-500/20 rounded-full filter blur-2xl pointer-events-none"></div>

        {/* Frozen Badge Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-20 flex flex-col items-center justify-center space-y-2">
            <div className="p-3 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 animate-pulse">
              <Snowflake className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-cyan-200 tracking-wider uppercase">Картку заморожено</span>
            <button 
              onClick={onToggleFreeze}
              className="px-4 py-1.5 rounded-full bg-cyan-400 text-black text-xs font-bold hover:bg-cyan-300 transition"
            >
              Розморозити
            </button>
          </div>
        )}

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-teal-300 flex items-center justify-center font-black text-black text-sm shadow-md">
              N
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">НЕ-ОБАНК</span>
              <span className="text-[10px] text-cyan-200/80 block leading-none font-medium">Turquoise Platinum</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-cyan-300 border border-cyan-400/20 transition-all text-xs flex items-center space-x-1 px-2.5"
            >
              {showDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showDetails ? 'Сховати' : 'Реквізити'}</span>
            </button>
          </div>
        </div>

        {/* Chip & Balance */}
        <div className="my-4 relative z-10 flex justify-between items-end">
          <div>
            <span className="text-[10px] text-cyan-100/70 block uppercase tracking-wider font-semibold">Баланс Картки</span>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline">
              {formattedBalance} <span className="text-sm font-bold text-cyan-300 ml-1">₴</span>
            </div>
          </div>

          <div className="w-10 h-7 rounded-md bg-gradient-to-r from-amber-200 via-amber-400 to-amber-300 border border-amber-500/40 opacity-90 shadow-inner"></div>
        </div>

        {/* Card Number & Holder */}
        <div className="space-y-1 relative z-10 pt-2 border-t border-cyan-500/20">
          <div className="flex justify-between items-center text-xs font-mono text-cyan-100 tracking-wider">
            <span>{showDetails ? cardNumber : `•••• •••• •••• ${cardNumber.slice(-4)}`}</span>
            <span className="text-[11px] text-cyan-200">{showDetails ? expiryDate : '••/••'}</span>
          </div>

          <div className="flex justify-between items-center pt-1 text-[11px]">
            <span className="font-medium text-cyan-200 uppercase tracking-widest">{cardHolder}</span>
            {showDetails && (
              <span className="font-mono text-xs bg-black/40 px-2 py-0.5 rounded text-cyan-300 border border-cyan-400/30">
                CVV: {cvv}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Controls Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={handleCopyIban}
          className="p-3 rounded-2xl bg-[#121721] hover:bg-[#1A2130] border border-cyan-500/15 flex items-center justify-between text-left transition"
        >
          <div>
            <span className="text-[10px] text-cyan-300/70 block uppercase font-medium">Реквізити IBAN</span>
            <span className="text-xs font-bold text-white truncate max-w-[120px] block font-mono">
              {iban.slice(0, 10)}...
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            {copiedIban ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
          </div>
        </button>

        <button 
          onClick={onToggleFreeze}
          className={cn(
            "p-3 rounded-2xl border flex items-center justify-between text-left transition",
            isFrozen 
              ? "bg-cyan-500/20 border-cyan-400/40 text-cyan-200" 
              : "bg-[#121721] hover:bg-[#1A2130] border-cyan-500/15 text-white"
          )}
        >
          <div>
            <span className="text-[10px] text-cyan-300/70 block uppercase font-medium">Заморозити картку</span>
            <span className="text-xs font-bold block">
              {isFrozen ? 'Заморожено' : 'Активна'}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Snowflake className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
