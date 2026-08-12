import React, { useState } from 'react';
import { CreditCard, Eye, EyeOff, Snowflake, Copy, Check, Settings2, Globe, Wifi, Smartphone, HelpCircle } from 'lucide-react';
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
  secretModeEnabled?: boolean;
}

export function TurquoiseCard({
  cardNumber = "5375 4141 3574 5030",
  cardHolder = "ARTEM SOKOLOV",
  cvv = "911",
  expiryDate = "12/30",
  iban = "UA93805299357450301000000123",
  balance,
  creditLimit,
  isFrozen,
  showBalance = true,
  onToggleFreeze,
  onToggleShowBalance,
  onOpenEditBalance,
  showToast,
  secretModeEnabled = false
}: TurquoiseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedRnokpp, setCopiedRnokpp] = useState(false);
  
  // Interactive Limits state
  const [isLimitsOpen, setIsLimitsOpen] = useState(false);
  const [internetLimit, setInternetLimit] = useState(15000); // in UAH
  const [withdrawLimit, setWithdrawLimit] = useState(5000); // in UAH
  const [transferLimit, setTransferLimit] = useState(30000); // in UAH
  const [blockInternational, setBlockInternational] = useState(false);
  const [doubleAuthActive, setDoubleAuthActive] = useState(true);

  const handleCopyIban = () => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    showToast('NEO•N•BANK', 'Реквізити рахунку IBAN скопійовано!', 'success');
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleCopyRnokpp = () => {
    navigator.clipboard.writeText("3574503010");
    setCopiedRnokpp(true);
    showToast('NEO•N•BANK', 'РНОКПП (ІПН) 3574503010 скопійовано успішно!', 'success');
    setTimeout(() => setCopiedRnokpp(false), 2000);
  };

  const handleLimitChange = (type: string, value: number) => {
    if (type === 'internet') setInternetLimit(value);
    if (type === 'withdraw') setWithdrawLimit(value);
    if (type === 'transfer') setTransferLimit(value);
    showToast('NEO•N•BANK', 'Ліміт платіжних операцій оновлено', 'success');
  };

  return (
    <div className="space-y-4 font-sans text-white">
      {/* 1. Platinum Premium Dark Card */}
      <div 
        className={cn(
          "relative rounded-3xl p-6 transition-all duration-300 overflow-hidden border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 shadow-2xl min-h-[220px] flex flex-col justify-between select-none",
          isFrozen && "opacity-60 saturate-50"
        )}
      >
        {/* Subtle glass abstract background */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-zinc-800/10 rounded-full filter blur-3xl pointer-events-none -translate-y-12 translate-x-12"></div>

        {/* Top bar */}
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 p-[1px]">
              <div className="w-full h-full bg-black rounded-[11px] flex items-center justify-center font-black text-white text-xs">
                N
              </div>
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 block leading-none">NEO•N•BANK</span>
              <span className="text-[7.5px] uppercase tracking-widest font-black text-cyan-400">Platinum Premium</span>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 px-3.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 active:scale-95 transition-all text-[11px] font-black tracking-wider text-cyan-400 uppercase flex items-center space-x-1.5"
          >
            {showDetails ? <EyeOff className="w-3.5 h-3.5 text-zinc-500" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{showDetails ? 'Сховати' : 'Деталі'}</span>
          </button>
        </div>

        {/* Middle Row: Balance display */}
        <div className="my-5 relative z-10 flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Баланс Картки</span>
            <div className="text-2xl font-black tracking-tight text-white flex items-baseline">
              {showBalance ? formatUAH(balance) : "•••••• ₴"}
            </div>
          </div>

          {/* EMV Contactless Chip - Redesigned to sleek Platinum Silver */}
          <div className="w-10 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-700/20 to-zinc-600/10"></div>
            <div className="w-3.5 h-3.5 border border-zinc-600/50 rounded-sm z-10 bg-zinc-900/40"></div>
          </div>
        </div>

        {/* Bottom credentials: No size shifts or spacing jumps */}
        <div className="space-y-2 relative z-10 pt-4 border-t border-zinc-900">
          <div className="flex justify-between items-center text-sm font-mono tracking-widest font-bold text-zinc-100 h-5">
            <span className="font-semibold transition-all">
              {showDetails ? cardNumber : `•••• •••• •••• ${cardNumber.replace(/\s+/g, '').slice(-4)}`}
            </span>
            <span className="text-xs text-zinc-400 transition-all">
              {showDetails ? expiryDate : '••/••'}
            </span>
          </div>

          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
            <span className="text-zinc-400">{cardHolder}</span>
            {showDetails && (
              <span className="font-mono text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-cyan-400 animate-fade-in">
                CVV: {cvv}
              </span>
            )}
          </div>
        </div>

        {/* Frozen state overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-20 flex flex-col items-center justify-center space-y-3 rounded-3xl border border-red-500/20 animate-fade-in">
            <div className="p-2.5 px-4 rounded-2xl bg-red-950/40 text-red-400 border border-red-500/30 font-black text-[10px] uppercase tracking-wider flex items-center space-x-2">
              <Snowflake className="w-4 h-4 animate-pulse" />
              <span>Картку заморожено</span>
            </div>
            <button 
              type="button"
              onClick={onToggleFreeze}
              className="px-5 py-2 rounded-xl border border-zinc-800 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-black transition uppercase tracking-wider"
            >
              Розморозити картку
            </button>
          </div>
        )}
      </div>

      {/* 2. Cohesive Dark-Themed Requisites Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <button 
          type="button"
          onClick={handleCopyIban}
          className="p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-850 active:scale-[0.98] flex items-center justify-between text-left transition-all"
        >
          <div className="min-w-0 flex-1 mr-2">
            <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-widest">Копіювати IBAN</span>
            <span className="text-xs font-bold text-white truncate block font-mono mt-0.5">
              {iban}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-cyan-400 border border-zinc-850">
            {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </div>
        </button>

        <button 
          type="button"
          onClick={handleCopyRnokpp}
          className="p-3.5 rounded-2xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-850 active:scale-[0.98] flex items-center justify-between text-left transition-all"
        >
          <div className="min-w-0 flex-1 mr-2">
            <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-widest">РНОКПП (ІПН)</span>
            <span className="text-xs font-bold text-white block font-mono mt-0.5">
              3574503010
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-cyan-400 border border-zinc-850">
            {copiedRnokpp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </div>
        </button>
      </div>

      {/* 3. Dark-Themed Requisites Details block */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 text-xs text-zinc-300 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Отримувач (Власник):</span>
          <span className="font-extrabold text-white text-right">Соколов Артем Сергійович</span>
        </div>
        <div className="flex justify-between items-center border-t border-zinc-900 pt-2">
          <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Банк отримувача:</span>
          <span className="font-extrabold text-white text-right">АТ «НЕО•Н•БАНК» (Київ)</span>
        </div>
        <div className="flex justify-between items-center border-t border-zinc-900 pt-2">
          <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-wider">Код МФО банку:</span>
          <span className="font-bold text-white font-mono text-right">305299</span>
        </div>
      </div>

      {/* 4. Functional Limits Management Module */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsLimitsOpen(!isLimitsOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-zinc-900/50 transition-all text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-xs uppercase tracking-wider block text-white leading-tight">Управління лімітами</span>
              <span className="text-[9px] text-zinc-500">Контроль безпеки та лімітів інтернет-витрат</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[9px] font-black text-zinc-300 uppercase tracking-wider border border-zinc-800">
            {isLimitsOpen ? 'Згорнути' : 'Налаштувати'}
          </div>
        </button>

        {isLimitsOpen && (
          <div className="p-4 border-t border-zinc-900 space-y-4 bg-zinc-950/40">
            {/* Limit 1: Internet payments */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center text-zinc-300">
                  <Globe className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                  Ліміт на інтернет-оплати
                </span>
                <span className="text-cyan-400 font-mono font-bold">{formatUAH(internetLimit * 100)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="50000" 
                step="500"
                value={internetLimit} 
                onChange={(e) => handleLimitChange('internet', parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>0 ₴</span>
                <span>50 000 ₴</span>
              </div>
            </div>

            {/* Limit 2: Cash withdrawals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="flex items-center text-zinc-300">
                  <Wifi className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Ліміт на перекази (P2P / IBAN)
                </span>
                <span className="text-cyan-400 font-mono font-bold">{formatUAH(transferLimit * 100)}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100000" 
                step="1000"
                value={transferLimit} 
                onChange={(e) => handleLimitChange('transfer', parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[9px] text-zinc-500">
                <span>0 ₴</span>
                <span>100 000 ₴</span>
              </div>
            </div>

            {/* Safety toggles */}
            <div className="pt-2 border-t border-zinc-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block text-zinc-300">Подвійна конвертація</span>
                  <span className="text-[10px] text-zinc-500">Блокувати операції з подвійним обміном</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBlockInternational(!blockInternational);
                    showToast('NEO•N•BANK', `Подвійну конвертацію ${!blockInternational ? 'заблоковано' : 'дозволено'}`, 'info');
                  }}
                  className={cn(
                    "w-10 h-5 rounded-full p-0.5 transition-colors duration-200",
                    blockInternational ? "bg-cyan-400" : "bg-zinc-800"
                  )}
                >
                  <div className={cn("bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200", blockInternational && "translate-x-5")} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block text-zinc-300">3D Secure / OTP у додатку</span>
                  <span className="text-[10px] text-zinc-500">Вимагати підтвердження push-кодом</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDoubleAuthActive(!doubleAuthActive);
                    showToast('NEO•N•BANK', `OTP авторизацію ${!doubleAuthActive ? 'увімкнено' : 'вимкнено'}`, 'info');
                  }}
                  className={cn(
                    "w-10 h-5 rounded-full p-0.5 transition-colors duration-200",
                    doubleAuthActive ? "bg-cyan-400" : "bg-zinc-800"
                  )}
                >
                  <div className={cn("bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200", doubleAuthActive && "translate-x-5")} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
