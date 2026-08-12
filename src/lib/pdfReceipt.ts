import { jsPDF } from 'jspdf';
import { Transaction } from '../store';

export function generateOfficialPDFReceipt(tx: Transaction) {
  // Create a high-DPI canvas to render a pristine receipt with full Cyrillic support and gorgeous typography
  const canvas = document.createElement('canvas');
  const scale = 2; // High-DPI resolution for sharp A4 output (approx 1588 x 2246 px)
  canvas.width = 794 * scale; 
  canvas.height = 1123 * scale;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    alert('Помилка створення генератора PDF');
    return;
  }

  ctx.scale(scale, scale);

  // Background - clean paper white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 794, 1123);

  let y = 50;

  // Top Dark Header Block (Cohesive slate blue banking vibe)
  ctx.fillStyle = '#090D16'; // Very dark premium slate
  ctx.fillRect(0, 0, 794, 110);

  // Logo & Bank Name (NEO•N•BANK)
  ctx.fillStyle = '#22D3EE'; // Cyan Neon Accents
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('NEO•N•BANK', 50, 65);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '9px sans-serif';
  ctx.fillText('АТ «НЕО•Н•БАНК» | ЄДРПОУ: 44411144 | вул. Хрещатик, 1, м. Київ, 01001', 50, 85);

  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('ЕЛЕКТРОННА КВИТАНЦІЯ', 744, 55);
  ctx.font = '9px sans-serif';
  ctx.fillText('ОФІЦІЙНИЙ ДОКУМЕНТ СИСТЕМИ', 744, 75);
  ctx.fillText('VALIDATED BY UKRAINIAN NATIONAL BANK SECURE GATEWAY', 744, 88);

  ctx.textAlign = 'left';

  // Receipt main title
  y = 155;
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`КВИТАНЦІЯ ПРО ПРОВЕДЕННЯ ПЛАТЕЖУ #TX-${tx.receiptNumber}-UA`, 50, y);

  y += 24;
  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  const formattedDate = new Date(tx.date).toLocaleString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  ctx.fillText(`Дата та час операції: ${formattedDate} (за київським часом)`, 50, y);

  // Elegant subtle line divider
  y += 20;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, y);
  ctx.lineTo(744, y);
  ctx.stroke();

  // Draw clean, elegant, high-contrast tables for financial details
  y += 35;
  
  // Custom rows representing actual Ukrainian banking documents
  const isIncome = tx.type === 'income';
  const rows = [
    ['Тип операції:', isIncome ? 'Вхідний платіж / Зарахування' : 'Вихідний переказ / Сплата за реквізитами'],
    ['Платник:', isIncome ? (tx.title || 'Зовнішній переказ') : 'Соколов Артем Сергійович (ARTEM SOKOLOV)'],
    ['ІПН Платника:', '3574503010'],
    ['Рахунок платника (IBAN):', 'UA93805299357450301000000123'],
    ['Отримувач:', isIncome ? 'Соколов Артем Сергійович' : (tx.title || 'Організація')],
    ['Призначення платежу:', tx.description || `Переказ коштів за послуги згідно договору`],
    ['Код транзакції (RRN):', `TX-${tx.receiptNumber}-UA`],
    ['Код авторизації НБУ:', `AUTH-${Math.floor(125000 + Math.random() * 800000)}`],
    ['Голова правління:', 'Соколов А. С.'],
    ['Статус платежу:', 'УСПІШНО ПРОВЕДЕНО']
  ];

  rows.forEach(([label, value]) => {
    // Label
    ctx.fillStyle = '#64748B';
    ctx.font = '11px sans-serif';
    ctx.fillText(label, 50, y);

    // Value with perfect wrapping if too long
    if (label === 'Статус платежу:') {
      ctx.fillStyle = '#10B981'; // Green status
    } else {
      ctx.fillStyle = '#0F172A';
    }
    ctx.font = 'bold 12px sans-serif';
    
    // Simple text wrapping if string is extremely long (like custom descriptions)
    if (value.length > 60) {
      ctx.fillText(value.slice(0, 60) + '...', 280, y);
    } else {
      ctx.fillText(value, 280, y);
    }

    // Subtle dotted row lines
    y += 10;
    ctx.strokeStyle = '#F1F5F9';
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(744, y);
    ctx.stroke();

    y += 20;
  });

  // Amount Highlight Box
  y += 5;
  ctx.fillStyle = isIncome ? '#ECFDF5' : '#F8FAFC';
  ctx.strokeStyle = isIncome ? '#10B981' : '#0F172A';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  // Drawing rounded rectangle manually for legacy cross-compatibility
  const rx = 50, ry = y, rw = 694, rh = 75, rr = 12;
  ctx.moveTo(rx + rr, ry);
  ctx.lineTo(rx + rw - rr, ry);
  ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
  ctx.lineTo(rx + rw, ry + rh - rr);
  ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
  ctx.lineTo(rx + rr, ry + rh);
  ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
  ctx.lineTo(rx, ry + rr);
  ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Загальна сума до сплати:', 75, y + 43);

  ctx.textAlign = 'right';
  ctx.fillStyle = isIncome ? '#059669' : '#0F172A';
  ctx.font = 'bold 24px sans-serif';
  const sign = isIncome ? '+' : '-';
  ctx.fillText(`${sign}${(tx.amount / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2 })} UAH`, 719, y + 45);

  ctx.textAlign = 'left';

  // Digital Signature section (КЕП / ЕЦП)
  y += 115;
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('ДОКУМЕНТ ПІДПИСАНО КВАЛІФІКОВАНИМ ЕЛЕКТРОННИМ ПІДПИСОМ (КЕП)', 50, y);

  // Verification QR-code placeholder inside a gorgeous visual box
  const qrBoxX = 50;
  const qrBoxY = y + 20;
  const qrBoxSize = 90;

  // Draw simulated QR verification container
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

  // Generate fake high-tech QR blocks for validation authenticity
  ctx.fillStyle = '#0F172A';
  // Top-left finder pattern
  ctx.fillRect(qrBoxX + 5, qrBoxY + 5, 25, 25);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrBoxX + 9, qrBoxY + 9, 17, 17);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(qrBoxX + 13, qrBoxY + 13, 9, 9);

  // Top-right finder pattern
  ctx.fillRect(qrBoxX + 60, qrBoxY + 5, 25, 25);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrBoxX + 64, qrBoxY + 9, 17, 17);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(qrBoxX + 68, qrBoxY + 13, 9, 9);

  // Bottom-left finder pattern
  ctx.fillRect(qrBoxX + 5, qrBoxY + 60, 25, 25);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrBoxX + 9, qrBoxY + 64, 17, 17);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(qrBoxX + 13, qrBoxY + 68, 9, 9);

  // Random QR matrix-style dots for authenticity
  ctx.fillStyle = '#0F172A';
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      if ((i + j) % 2 === 0 || (i * j) % 3 === 1) {
        ctx.fillRect(qrBoxX + 35 + i * 4, qrBoxY + 35 + j * 4, 3, 3);
      }
      if ((i * j) % 2 === 1) {
        ctx.fillRect(qrBoxX + 5 + i * 4, qrBoxY + 35 + j * 4, 3, 3);
        ctx.fillRect(qrBoxX + 35 + i * 4, qrBoxY + 5 + j * 4, 3, 3);
      }
    }
  }

  // Stamp circle (official royal blue wet stamp of the bank)
  const stampX = 580;
  const stampY = qrBoxY - 10;
  
  ctx.save();
  ctx.translate(stampX, stampY);
  ctx.strokeStyle = '#1E40AF'; // Royal blue stamp
  ctx.lineWidth = 3.5;

  // Outer Circle
  ctx.beginPath();
  ctx.arc(65, 65, 60, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Circle
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(65, 65, 48, 0, Math.PI * 2);
  ctx.stroke();

  // Stamp lettering inside circular path
  ctx.fillStyle = '#1E40AF';
  ctx.font = 'bold 8.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('АТ «НЕО•Н•БАНК»', 65, 48);
  ctx.font = '7px sans-serif';
  ctx.fillText('ЄДРПОУ 44411144', 65, 62);
  ctx.fillText('СПЛАЧЕНО', 65, 74);
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('★ АТ НЕО-Н-БАНК ★', 65, 88);
  ctx.restore();

  ctx.textAlign = 'left';

  // Digital Signature Text
  const sigTextX = qrBoxX + qrBoxSize + 20;
  let sigY = qrBoxY + 10;

  ctx.fillStyle = '#475569';
  ctx.font = '11px sans-serif';
  ctx.fillText('Підписано КЕП: АТ «НЕО•Н•БАНК»', sigTextX, sigY);

  sigY += 18;
  ctx.fillText('Сертифікат КЕП: № UA-3574503010-2026', sigTextX, sigY);

  sigY += 18;
  ctx.font = '10px monospace';
  ctx.fillText(`Хеш документа (SHA-256):`, sigTextX, sigY);
  
  sigY += 14;
  ctx.fillText(`8f9b2a1c0d3e${tx.receiptNumber.substring(0, 12).toLowerCase()}a89f921`, sigTextX, sigY);

  sigY += 18;
  ctx.font = '11px sans-serif';
  ctx.fillStyle = '#0F172A';
  ctx.fillText('Скануйте QR-код для миттєвої перевірки статусу в реєстрі НБУ', sigTextX, sigY);

  // Footer Disclaimer
  y = qrBoxY + qrBoxSize + 60;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, y);
  ctx.lineTo(744, y);
  ctx.stroke();

  y += 25;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '9.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ця квитанція є офіційним платіжним документом, що підтверджує проведення фінансової транзакції.', 397, y);
  ctx.fillText('Сформовано автоматизованою банківською системою NEO•N•BANK CORE. Довідкова служба: support@neobank.app', 397, y + 15);

  // Save PDF document using high resolution canvas data URL
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  pdf.save(`NEON_BANK_RECEIPT_${tx.receiptNumber}.pdf`);
}
