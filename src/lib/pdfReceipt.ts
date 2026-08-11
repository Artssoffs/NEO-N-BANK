import { jsPDF } from 'jspdf';
import { Transaction } from '../store';

// Helper to generate a realistic circular bank stamp as Data URL
function createBankStampCanvas(receiptNo: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Outer circle
  ctx.strokeStyle = '#0891B2'; // Turquoise/Cyan seal
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(150, 150, 135, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(150, 150, 105, 0, Math.PI * 2);
  ctx.stroke();

  // Text along arc
  ctx.fillStyle = '#0891B2';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';

  // Circular text
  const textTop = "АКЦІОНЕРНЕ ТОВАРИСТВО «НЕ-ОБАНК»";
  const radius = 120;
  for (let i = 0; i < textTop.length; i++) {
    const angle = -Math.PI / 1.3 + (i / textTop.length) * (Math.PI * 1.5);
    ctx.save();
    ctx.translate(150 + Math.cos(angle) * radius, 150 + Math.sin(angle) * radius);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(textTop[i], 0, 0);
    ctx.restore();
  }

  // Center text & badge
  ctx.fillStyle = '#06B6D4';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText("НЕ-ОБАНК", 150, 125);

  ctx.fillStyle = '#0891B2';
  ctx.font = '12px sans-serif';
  ctx.fillText("ЛІЦЕНЗІЯ НБУ №302", 150, 148);
  ctx.fillText("ЕЕЛЕКТРОННИЙ ПІДПИС", 150, 168);
  ctx.fillText(`ЧЕК № ${receiptNo}`, 150, 188);

  // Star decoration
  ctx.font = '16px sans-serif';
  ctx.fillText("★ ОПЛАЧЕНО ★", 150, 215);

  return canvas.toDataURL('image/png');
}

export function generateOfficialPDFReceipt(tx: Transaction) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Background light tint
  doc.setFillColor(250, 252, 253);
  doc.rect(0, 0, 210, 297, 'F');

  // Top header bar (Ne-OBank Turquoise)
  doc.setFillColor(8, 145, 178); // Teal
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('НЕ-ОБАНК', 15, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Електронний квитанція-чек про фінансову операцію', 205, 18, { align: 'right' });

  // Document Container Box
  doc.setDrawColor(220, 225, 230);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(12, 36, 186, 240, 4, 4, 'FD');

  let y = 50;

  // Header Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('КВИТАНЦІЯ / ЕЛЕКТРОННИЙ ЧЕК № ' + tx.receiptNumber, 20, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Банк платника/отримувача: АТ «НЕ-ОБАНК» (Ліцензія НБУ №302 від 18.10.2018 р.)', 20, y);

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, y, 190, y);

  // Table Details
  y += 12;
  const details = [
    ['Дата та час транзакції:', new Date(tx.date).toLocaleString('uk-UA')],
    ['Номер документу (RRN):', tx.receiptNumber],
    ['Код авторизації:', `AUTH-${Math.floor(100000 + Math.random() * 900000)}`],
    ['Спосіб оплати:', tx.isCash ? 'Готівковий гаманець (Cash Mode)' : (tx.paymentMethod === 'atm' ? 'Банкомат НЕ-ОБАНК' : 'Картка НЕ-ОБАНК')],
    ['Тип операції:', tx.type === 'income' ? 'Зарахування / Прибуток' : 'Списання / Витрата'],
    ['Найменування платежу:', tx.title],
    ['Категорія:', tx.category],
    ['Опис операції:', tx.description || 'Електронна фінансова операція через Ne-OBank'],
    ['Місце проведення:', tx.location || 'м. Київ, Україна (Електронний банкінг)'],
    ['Статус платежу:', 'УСПІШНО ВИКОНАНО (SUCCESS)']
  ];

  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9.5);
    doc.text(label, 20, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, 85, y);

    y += 8;
  });

  y += 4;
  doc.line(20, y, 190, y);

  // Total Amount Box
  y += 10;
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(20, 184, 166);
  doc.roundedRect(20, y, 170, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Загальна сума операції:', 26, y + 14);

  doc.setFontSize(16);
  if (tx.type === 'income') {
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`+${(tx.amount / 100).toFixed(2)} UAH`, 184, y + 14, { align: 'right' });
  } else {
    doc.setTextColor(13, 148, 136); // Teal
    doc.text(`-${(tx.amount / 100).toFixed(2)} UAH`, 184, y + 14, { align: 'right' });
  }

  // Official Stamp & Digital Signature Section
  y += 34;

  try {
    const stampDataUrl = createBankStampCanvas(tx.receiptNumber);
    if (stampDataUrl) {
      doc.addImage(stampDataUrl, 'PNG', 135, y, 50, 50);
    }
  } catch (e) {
    console.warn("Could not render stamp canvas image to PDF", e);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Кваліфікований електронний підпис та печатка:', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Електронний документ підписано КЕП АТ «НЕ-ОБАНК»', 20, y + 12);
  doc.text('Серийний номер сертифіката: 4F82A9001234BCA9', 20, y + 17);
  doc.text(`Хеш-код КЕП: SHA256:${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`, 20, y + 22);
  doc.text('Перевірити чинність документу можна в застосунку НЕ-ОБАНК або НБУ.', 20, y + 27);

  // Footer note
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Квитанція сформована автоматично в процесі обробки транзакції системою Ne-OBank Core.', 105, 268, { align: 'center' });
  doc.text('Служба підтримки НЕ-ОБАНК: 0 800 300 800 | support@neobank.ua', 105, 272, { align: 'center' });

  doc.save(`NeOBank_Receipt_${tx.receiptNumber}.pdf`);
}
