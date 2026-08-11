export const exportTransactionsToKeep = async (transactions: any[]) => {
  // 1. Prepare text content
  let text = '📓 Історія операцій (Готівка) - NEO-N•BANK\n\n';
  
  transactions.forEach((tx) => {
    const sign = tx.type === 'expense' ? '-' : '+';
    const amount = `${sign}${(tx.amount / 100).toFixed(2)} ₴`;
    const date = new Date(tx.date).toLocaleString('uk-UA');
    text += `${date} | ${tx.category} | ${amount}\n`;
    text += `Призначення: ${tx.title}\n`;
    if (tx.description) {
      text += `Опис: ${tx.description}\n`;
    }
    if (tx.location) {
      text += `Місце: ${tx.location}\n`;
    }
    text += '----------------------------------------\n';
  });

  try {
    await navigator.clipboard.writeText(text);
    return { success: true, copied: true, text };
  } catch (err) {
    console.warn('Clipboard write failed:', err);
    return { success: true, copied: false, text };
  }
};
