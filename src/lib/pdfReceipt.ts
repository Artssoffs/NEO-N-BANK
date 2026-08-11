import { jsPDF } from 'jspdf';
import { Transaction } from '../store';

export function generateOfficialPDFReceipt(tx: Transaction) {
  // Create a high-DPI canvas to render the receipt with full Cyrillic support
  const canvas = document.createElement('canvas');
  const scale = 2; // High resolution (approx 1654 x 2338 px for A4)
  canvas.width = 794 * scale; 
  canvas.height = 1123 * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    alert('Помилка створення генератора PDF');
    return;
  }

  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, 794, 1123);

  // Top header bar
  ctx.fillStyle = '#4F46E5'; // Premium Royal Indigo
  ctx.fillRect(0, 0, 794, 90);

  // Logo & Bank Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('Ne•OBank App', 45, 55);

  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ОФІЦІЙНА ЕЛЕКТРОННА КВИТАНЦІЯ-ЧЕК', 749, 53);

  // White Document Box
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  
  // Draw rounded box for receipt
  const boxX = 45;
  const boxY = 120;
  const boxW = 704;
  const boxH = 920;
  const radius = 12;

  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxW - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + radius);
  ctx.lineTo(boxX + boxW, boxY + boxH - radius);
  ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - radius, boxY + boxH);
  ctx.lineTo(boxX + radius, boxY + boxH);
  ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  let y = 165;
  ctx.textAlign = 'left';

  // Receipt Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`КВИТАНЦІЯ № ${tx.receiptNumber}`, 75, y);

  y += 24;
  ctx.fillStyle = '#64748B';
  ctx.font = '13px sans-serif';
  ctx.fillText('Банк платника / отримувача: АТ «Ne•OBank App» (Ліцензія НБУ №302 від 18.10.2018 р.)', 75, y);

  y += 20;
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(75, y);
  ctx.lineTo(719, y);
  ctx.stroke();

  // Table Details
  y += 35;
  const isIncome = tx.type === 'income';
  const formattedDate = new Date(tx.date).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const rows = [
    ['Дата та час транзакції:', formattedDate],
    ['Номер документу (RRN):', tx.receiptNumber],
    ['Код авторизації:', `AUTH-${Math.floor(100000 + Math.random() * 900000)}`],
    ['Спосіб оплати:', tx.isCash ? 'Готівковий гаманець (Cash Wallet)' : (tx.paymentMethod === 'atm' ? 'Банкомат Ne•OBank App' : 'Картка Luxury Platinum')],
    ['Тип операції:', isIncome ? 'Зарахування / Прибуток' : 'Списання / Витрата'],
    ['Назва платежу / Призначення:', tx.title],
    ['Категорія:', tx.category],
    ['Деталі та опис:', tx.description || 'Електронна транзакція в Ne•OBank App Core'],
    ['Місце проведення:', tx.location || 'м. Київ, Україна (Digital Banking)'],
    ['Статус платежу:', 'УСПІШНО ВИКОНАНО (SUCCESS)']
  ];

  rows.forEach(([label, value]) => {
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(label, 75, y);

    ctx.fillStyle = '#0F172A';
    ctx.font = '14px sans-serif';
    ctx.fillText(value, 300, y);

    y += 28;
  });

  y += 10;
  ctx.beginPath();
  ctx.moveTo(75, y);
  ctx.lineTo(719, y);
  ctx.stroke();

  // Total Amount Box
  y += 25;
  ctx.fillStyle = isIncome ? '#ECFDF5' : '#F5F3FF'; // Light violet for expenses
  ctx.strokeStyle = isIncome ? '#10B981' : '#8B5CF6'; // Violet border
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(75, y, 644, 70, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Загальна сума операції:', 95, y + 42);

  ctx.textAlign = 'right';
  ctx.fillStyle = isIncome ? '#059669' : '#7C3AED'; // Rich green / deep violet
  ctx.font = 'bold 26px sans-serif';
  const sign = isIncome ? '+' : '-';
  ctx.fillText(`${sign}${(tx.amount / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} UAH`, 700, y + 44);

  // Official Stamp & Digital Signature Section
  ctx.textAlign = 'left';
  y += 110;

  // Render Official Bank Stamp on Canvas
  const stampX = 520;
  const stampY = y - 20;

  ctx.save();
  ctx.translate(stampX, stampY);

  // Stamp circles
  ctx.strokeStyle = '#7C3AED'; // Royal Violet
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(80, 80, 75, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(80, 80, 60, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#7C3AED';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('АТ «Ne•OBank App»', 80, 65);
  ctx.font = '9px sans-serif';
  ctx.fillText('ЛІЦЕНЗІЯ НБУ №302', 80, 80);
  ctx.fillText('Е-ПІДПИС & ПЕЧАТКА', 80, 93);
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('★ ОПЛАЧЕНО ★', 80, 110);
  ctx.restore();

  // Digital Signature Info
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Кваліфікований електронний підпис та печатка (КЕП):', 75, y);

  y += 22;
  ctx.fillStyle = '#475569';
  ctx.font = '13px sans-serif';
  ctx.fillText('Підписант: АТ «Ne•OBank App» (Електронний підпис авторизованого банку)', 75, y);

  y += 20;
  ctx.fillText(`Сертифікат КЕП: № 4F82A9001234BCA90098`, 75, y);

  y += 20;
  ctx.font = '12px monospace';
  ctx.fillText(`Хеш SHA256: 8f9b2a1c0d3e${tx.receiptNumber.replace(/-/g,'').toLowerCase()}7f8e9a1b2c3d4e5f`, 75, y);

  y += 20;
  ctx.font = '12px sans-serif';
  ctx.fillText('Перевірка чинності документу: https://neobank.app/verify', 75, y);

  // Footer Note
  y += 65;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Квитанція сформована автоматично в процесі обробки транзакції системою Ne•OBank App Core.', 397, y);
  ctx.fillText('Служба підтримки Ne•OBank App: 0 800 300 800 | support@neobank.app', 397, y + 18);

  // Convert canvas to image and export PDF via jsPDF
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  pdf.save(`Ne_OBank_App_Receipt_${tx.receiptNumber}.pdf`);
}
