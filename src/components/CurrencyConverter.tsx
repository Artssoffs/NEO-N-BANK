import React, { useState } from 'react';
import { ArrowRightLeft, DollarSign, RefreshCw } from 'lucide-react';

interface CurrencyRates {
  USD: { buy: number; sell: number };
  EUR: { buy: number; sell: number };
  PLN: { buy: number; sell: number };
}

const rates: CurrencyRates = {
  USD: { buy: 41.20, sell: 41.70 },
  EUR: { buy: 44.80, sell: 45.40 },
  PLN: { buy: 10.30, sell: 10.65 }
};

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurr, setFromCurr] = useState<'UAH' | 'USD' | 'EUR' | 'PLN'>('USD');
  const [toCurr, setToCurr] = useState<'UAH' | 'USD' | 'EUR' | 'PLN'>('UAH');

  const calculateConversion = (): string => {
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) return '0.00';

    if (fromCurr === toCurr) return numericAmount.toFixed(2);

    // Convert from origin to UAH
    let amountInUah = numericAmount;
    if (fromCurr !== 'UAH') {
      amountInUah = numericAmount * rates[fromCurr].buy;
    }

    // Convert from UAH to target currency
    if (toCurr === 'UAH') {
      return amountInUah.toFixed(2);
    } else {
      return (amountInUah / rates[toCurr].sell).toFixed(2);
    }
  };

  const handleSwap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
  };

  return (
    <div className="p-4 rounded-3xl bg-[#121721] border border-violet-500/20 space-y-3">
      {/* Rate Ticker Header */}
      <div className="flex justify-between items-center border-b border-violet-500/15 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-300">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">Курси Валют Ne•OBank App</span>
        </div>
        <span className="text-[10px] text-violet-300/60 font-mono">НБУ • Live</span>
      </div>

      {/* Exchange Rate Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-xl bg-black/40 border border-violet-500/10">
          <span className="text-[10px] text-violet-300 font-bold block">USD $</span>
          <div className="text-[11px] text-white mt-0.5">
            <span className="text-emerald-400 font-semibold">{rates.USD.buy.toFixed(2)}</span> / <span>{rates.USD.sell.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-black/40 border border-violet-500/10">
          <span className="text-[10px] text-violet-300 font-bold block">EUR €</span>
          <div className="text-[11px] text-white mt-0.5">
            <span className="text-emerald-400 font-semibold">{rates.EUR.buy.toFixed(2)}</span> / <span>{rates.EUR.sell.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-black/40 border border-violet-500/10">
          <span className="text-[10px] text-violet-300 font-bold block">PLN zł</span>
          <div className="text-[11px] text-white mt-0.5">
            <span className="text-emerald-400 font-semibold">{rates.PLN.buy.toFixed(2)}</span> / <span>{rates.PLN.sell.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Converter Calculator */}
      <div className="p-3 rounded-2xl bg-black/30 border border-violet-500/15 space-y-2">
        <span className="text-[10px] text-violet-200/60 font-medium block uppercase">Конвертер валют</span>

        <div className="flex items-center space-x-2">
          {/* From Input */}
          <div className="flex-1 bg-black/50 border border-violet-500/20 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-sm focus:outline-none"
            />
            <select 
              value={fromCurr}
              onChange={(e) => setFromCurr(e.target.value as any)}
              className="bg-violet-950 text-violet-300 font-bold text-xs rounded px-1 py-0.5 border border-violet-500/30 focus:outline-none"
            >
              <option value="UAH">UAH ₴</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="PLN">PLN zł</option>
            </select>
          </div>

          <button 
            onClick={handleSwap}
            className="p-2 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition active:rotate-180"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          {/* To Output */}
          <div className="flex-1 bg-black/50 border border-violet-500/20 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
            <span className="text-violet-300 font-black text-sm truncate">
              {calculateConversion()}
            </span>
            <select 
              value={toCurr}
              onChange={(e) => setToCurr(e.target.value as any)}
              className="bg-violet-950 text-violet-300 font-bold text-xs rounded px-1 py-0.5 border border-violet-500/30 focus:outline-none"
            >
              <option value="UAH">UAH ₴</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="PLN">PLN zł</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
