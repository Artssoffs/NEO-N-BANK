import { getAccessToken } from './auth';

export const exportTransactionsToDocs = async (transactions: any[]) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google');
  }

  // 1. Create a new document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: `Виписка Готівки (Sense Cash Mode) - ${new Date().toLocaleDateString()}`
    })
  });

  if (!createRes.ok) {
    throw new Error('Failed to create document');
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // 2. Prepare text content
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

  // 3. Insert text into the document
  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: {
              index: 1,
            },
            text: text,
          }
        }
      ]
    })
  });

  if (!updateRes.ok) {
    throw new Error('Failed to update document with transactions');
  }

  return documentId;
};
