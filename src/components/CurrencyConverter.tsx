import React, { useState } from 'react';
import { ArrowRightLeft, DollarSign, RefreshCw, CheckCircle2, CreditCard, ArrowRight, ShieldCheck, Sparkles, Coins } from 'lucide-react';
import { useStore } from '../store';
import { formatUAH } from '../lib/utils';

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
  const { user, updateUser, addTransaction } = useStore();
  const [amount, setAmount] = useState<string>('100');
  const [fromCurr, setFromCurr] = useState<'UAH' | 'USD' | 'EUR' | 'PLN'>('UAH');
  const [toCurr, setToCurr] = useState<'UAH' | 'USD' | 'EUR' | 'PLN'>('USD');
  const [virtualBalances, setVirtualBalances] = useState<{ USD: number; EUR: number; PLN: number }>({
    USD: 150,
    EUR: 80,
    PLN: 300
  });

  // Tracking opened cards
  const [openedCards, setOpenedCards] = useState<{ USD: boolean; EUR: boolean; PLN: boolean }>({
    USD: true,
    EUR: true,
    PLN: false
  });
  
  const [exchangeSuccess, setExchangeSuccess] = useState<string | null>(null);

  const calculateConversion = (): { num: number; str: string } => {
    const numericAmount = parseFloat(amount) || 0;
    if (numericAmount <= 0) return { num: 0, str: '0.00' };

    if (fromCurr === toCurr) return { num: numericAmount, str: numericAmount.toFixed(2) };

    // Convert from origin to UAH
    let amountInUah = numericAmount;
    if (fromCurr !== 'UAH') {
      amountInUah = numericAmount * rates[fromCurr].buy;
    }

    // Convert from UAH to target currency
    if (toCurr === 'UAH') {
      return { num: amountInUah, str: amountInUah.toFixed(2) };
    } else {
      const resVal = amountInUah / rates[toCurr].sell;
      return { num: resVal, str: resVal.toFixed(2) };
    }
  };

  const { num: targetAmountValue, str: targetAmountStr } = calculateConversion();

  const handleSwap = () => {
    setFromCurr(toCurr);
    setToCurr(fromCurr);
  };

  const handleInstantExchange = () => {
    const sourceAmountNum = parseFloat(amount) || 0;
    if (sourceAmountNum <= 0) return;

    if (fromCurr === 'UAH') {
      // Check if target card is opened
      if (toCurr !== 'UAH' && !openedCards[toCurr]) {
        alert(`Спочатку відкрийте віртуальну картку ${toCurr}!`);
        return;
      }

      // Buying foreign currency using UAH balance
      const costInPennies = Math.round(sourceAmountNum * 100);
      if (user.balance < costInPennies) {
        alert('Недостатньо коштів на вашій гривневій картці!');
        return;
      }

      // Deduct UAH
      const newUahBalance = user.balance - costInPennies;
      updateUser({ balance: newUahBalance });

      // Credit target virtual balance
      if (toCurr !== 'UAH') {
        const creditedAmount = targetAmountValue;
        setVirtualBalances(prev => ({
          ...prev,
          [toCurr]: prev[toCurr] + creditedAmount
        }));

        // Add real transaction in history
        addTransaction({
          type: 'expense',
          amount: costInPennies,
          title: `Купівля валюти ${toCurr}`,
          category: 'Обмін валют',
          description: `Придбано ${creditedAmount.toFixed(2)} ${toCurr} за курсом ${rates[toCurr].sell.toFixed(2)} ₴`,
          status: 'success',
          isCash: false,
          paymentMethod: 'sense_card'
        });

        setExchangeSuccess(`Успішно придбано ${creditedAmount.toFixed(2)} ${toCurr} та миттєво зараховано на віртуальну картку!`);
        setTimeout(() => setExchangeSuccess(null), 5000);
      }
    } else if (toCurr === 'UAH') {
      // Selling foreign currency to get UAH
      if (!openedCards[fromCurr]) {
        alert(`Картку ${fromCurr} не активовано!`);
        return;
      }

      if (virtualBalances[fromCurr] < sourceAmountNum) {
        alert(`Недостатньо коштів на вашій віртуальній картці ${fromCurr}!`);
        return;
      }

      // Deduct foreign
      setVirtualBalances(prev => ({
        ...prev,
        [fromCurr]: prev[fromCurr] - sourceAmountNum
      }));

      // Credit UAH
      const gainedUahPennies = Math.round(targetAmountValue * 100);
      updateUser({ balance: user.balance + gainedUahPennies });

      // Add real transaction
      addTransaction({
        type: 'income',
        amount: gainedUahPennies,
        title: `Продаж валюти ${fromCurr}`,
        category: 'Обмін валют',
        description: `Продано ${sourceAmountNum.toFixed(2)} ${fromCurr} за курсом ${rates[fromCurr].buy.toFixed(2)} ₴`,
        status: 'success',
        isCash: false,
        paymentMethod: 'sense_card'
      });

      setExchangeSuccess(`Успішно продано ${sourceAmountNum.toFixed(2)} ${fromCurr}. На картку зараховано ${formatUAH(gainedUahPennies)}!`);
      setTimeout(() => setExchangeSuccess(null), 5000);
    } else {
      alert('Обмін підтримується тільки у парі з гривнею (UAH)!');
    }
  };

  const handleOpenCard = (curr: 'USD' | 'EUR' | 'PLN') => {
    setOpenedCards(prev => ({ ...prev, [curr]: true }));
    addTransaction({
      type: 'income',
      amount: 0,
      title: `Відкриття віртуальної картки ${curr}`,
      category: 'Картки',
      description: `Успішно активовано безкоштовну цифрову картку в валюті ${curr}`,
      status: 'success',
      isCash: false,
      paymentMethod: 'sense_card'
    });
  };

  const selectRates = (curr: 'USD' | 'EUR' | 'PLN') => {
    setFromCurr('UAH');
    setToCurr(curr);
  };

  return (
    <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-900 space-y-4 shadow-xl">
      {/* Rate Ticker Header */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 flex items-center justify-center">
            <Coins className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">Курси Валют & Миттєвий Обмін</span>
            <span className="text-[9px] text-zinc-500 block">Офіційні котирування НБУ • 0% комісії</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <RefreshCw className="w-3 h-3 text-zinc-700 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[9px] text-zinc-600 font-mono">ОНОВЛЕНО LIVE</span>
        </div>
      </div>

      {/* Interactive Ticker Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {(['USD', 'EUR', 'PLN'] as const).map((curr) => {
          const sym = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : 'zł';
          const active = openedCards[curr];
          return (
            <div 
              key={curr}
              onClick={() => selectRates(curr)}
              className="p-3 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-cyan-400/30 transition duration-250 cursor-pointer text-left flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-black tracking-widest">{curr} {sym}</span>
                {active ? (
                  <span className="text-[8px] bg-cyan-400/10 text-cyan-400 px-1.5 py-0.5 rounded font-black uppercase">АКТИВНА</span>
                ) : (
                  <span className="text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-black uppercase">OFF</span>
                )}
              </div>
              <div className="mt-2.5 space-y-0.5">
                <div className="text-[8px] text-zinc-600 uppercase tracking-widest font-black">Купівля / Продаж</div>
                <div className="flex space-x-1 text-xs font-mono font-bold">
                  <span className="text-emerald-400">{rates[curr].buy.toFixed(2)}</span>
                  <span className="text-zinc-700">/</span>
                  <span className="text-cyan-400">{rates[curr].sell.toFixed(2)}</span>
                </div>
              </div>
              {active ? (
                <div className="mt-2 pt-1.5 border-t border-zinc-900 text-[9px] text-zinc-400 font-semibold flex justify-between">
                  <span>Баланс:</span>
                  <span className="font-extrabold text-white">{virtualBalances[curr].toFixed(2)} {sym}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCard(curr);
                  }}
                  className="mt-2 py-1 rounded bg-cyan-400 hover:bg-cyan-300 text-zinc-950 text-[8px] font-black uppercase tracking-wider text-center"
                >
                  Відкрити картку
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Converter Calculator Block */}
      <div className="p-4 rounded-2xl bg-zinc-900/20 border border-zinc-900 space-y-3">
        <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block">Швидкий калькулятор конвертації</span>

        <div className="space-y-2">
          {/* FROM CURRENCY INPUT */}
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl p-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[8px] text-zinc-500 uppercase tracking-wider block">Віддаєте</span>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent text-white font-mono font-bold text-base focus:outline-none w-full"
              />
            </div>
            <select 
              value={fromCurr}
              onChange={(e) => setFromCurr(e.target.value as any)}
              className="bg-zinc-900 text-zinc-200 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="UAH">UAH ₴</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="PLN">PLN zł</option>
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center -my-2.5 relative z-10">
            <button 
              type="button"
              onClick={handleSwap}
              className="p-2 rounded-xl bg-cyan-400 text-zinc-950 hover:bg-cyan-300 hover:scale-105 active:scale-95 transition shadow-lg border border-zinc-950"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TO CURRENCY INPUT */}
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl p-3">
            <div className="space-y-0.5 min-w-0 flex-1">
              <span className="text-[8px] text-zinc-500 uppercase tracking-wider block">Отримуєте</span>
              <span className="text-cyan-400 font-mono font-black text-base block truncate">
                {targetAmountStr}
              </span>
            </div>
            <select 
              value={toCurr}
              onChange={(e) => setToCurr(e.target.value as any)}
              className="bg-zinc-900 text-zinc-200 font-bold text-xs rounded-lg px-2.5 py-1.5 border border-zinc-800 focus:outline-none cursor-pointer"
            >
              <option value="UAH">UAH ₴</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="PLN">PLN zł</option>
            </select>
          </div>
        </div>

        {/* Info label about active balance and requirements */}
        <div className="text-[9px] text-zinc-500 flex justify-between items-center bg-black/40 p-2 rounded-lg border border-zinc-900">
          <span>Резерв на балансі:</span>
          <span className="font-bold text-white font-mono">
            {fromCurr === 'UAH' ? formatUAH(user.balance) : `${virtualBalances[fromCurr].toFixed(2)} ${fromCurr === 'USD' ? '$' : fromCurr === 'EUR' ? '€' : 'zł'}`}
          </span>
        </div>

        {/* Success alert message */}
        {exchangeSuccess && (
          <div className="p-3 bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs rounded-xl flex items-start space-x-2 animate-fade-in">
            <Sparkles className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <span>{exchangeSuccess}</span>
          </div>
        )}

        {/* EXCHANGE ACTION TRIGGER */}
        <button
          type="button"
          onClick={handleInstantExchange}
          disabled={parseFloat(amount) <= 0}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-md active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-30 disabled:pointer-events-none"
        >
          <CreditCard className="w-4 h-4" />
          <span>Підтвердити та обміняти</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
