import { getAccessToken } from './auth';

export const exportTransactionsToKeep = async (transactions: any[]) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google');
  }

  // 1. Prepare text content
  let text = 'Історія операцій (Готівка)\n\n';
  
  transactions.forEach((tx) => {
    const sign = tx.type === 'expense' ? '-' : '+';
    const amount = `${sign}${(tx.amount / 100).toFixed(2)} ₴`;
    const date = new Date(tx.date).toLocaleString('uk-UA');
    text += `${date} | ${tx.category} | ${amount}\n`;
    if (tx.note) {
      text += `Нотатка: ${tx.note}\n`;
    }
    if (tx.location) {
      text += `Місце: ${tx.location}\n`;
    }
    text += '----------------------------------------\n';
  });

  // 2. Create a new note
  const createRes = await fetch('https://keep.googleapis.com/v1/notes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Виписка Готівки (Sense Cash Mode) - ${new Date().toLocaleDateString()}`,
      body: {
        text: {
          text: text
        }
      }
    })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create note: ${errorText}`);
  }

  return await createRes.json();
};
