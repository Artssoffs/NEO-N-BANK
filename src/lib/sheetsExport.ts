import { getAccessToken } from './auth';

export const exportTransactionsToSheets = async (transactions: any[]) => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Необхідна авторизація в Google');
  }

  const dateTitle = new Date().toLocaleDateString('uk-UA');

  // 1. Create a new Google Spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v1/spreadsheets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: `NEO-N•BANK Виписка - ${dateTitle}`
      }
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('Failed to create sheet:', errText);
    throw new Error('Не вдалося створити таблицю Google Sheets');
  }

  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;
  const spreadsheetUrl = sheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // 2. Format values
  const rows = [
    ['Дата та Час', 'Тип', 'Категорія', 'Сума (₴)', 'Опис / Назва', 'Місце / Нотатка']
  ];

  transactions.forEach((tx) => {
    const isExpense = tx.type === 'expense';
    const amountVal = isExpense ? -(tx.amount / 100) : (tx.amount / 100);
    const typeLabel = isExpense ? 'Витрата' : 'Дохід';
    const dateStr = new Date(tx.date).toLocaleString('uk-UA');
    const description = tx.title || tx.description || tx.note || '';
    const locationStr = tx.location || '';

    rows.push([
      dateStr,
      typeLabel,
      tx.category || 'Без категорії',
      amountVal.toString(),
      description,
      locationStr
    ]);
  });

  // 3. Populate data via batchUpdate / values update
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v1/spreadsheets/${spreadsheetId}/values/A1:F${rows.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: `A1:F${rows.length}`,
        majorDimension: 'ROWS',
        values: rows
      })
    }
  );

  if (!updateRes.ok) {
    const errText = await updateRes.text();
    console.error('Failed to update sheet values:', errText);
    throw new Error('Не вдалося заповнити дані в Google Sheets');
  }

  return { spreadsheetId, spreadsheetUrl };
};
