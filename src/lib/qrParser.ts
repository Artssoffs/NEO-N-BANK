export interface ScannedPaymentData {
  type: 'card' | 'mobile' | 'iban' | 'utility';
  targetNumber: string;
  amount?: string;
  comment?: string;
  recipientName?: string;
  taxId?: string;
  raw: string;
}

export function parseScannedCode(decodedText: string): ScannedPaymentData {
  const text = decodedText.trim();

  // 1. Ukrainian IBAN Standard (starts with UA + 26 digits or contains UA\d{26})
  const ibanRegex = /UA\d{26}/i;
  const ibanMatch = text.match(ibanRegex);
  
  if (ibanMatch) {
    const iban = ibanMatch[0].toUpperCase();
    
    // Extract sum if present in Ukrainian/NBU QR parameters (Sum=150.00, sum=150, amount=150,00)
    let amountStr = '';
    const sumMatch = text.match(/(?:sum|amount|сума|сум)=([\d.,]+)/i);
    if (sumMatch) {
      amountStr = sumMatch[1].replace(',', '.');
    }
    
    // Extract purpose/comment (Purpose=..., Purpose=..., comment=...)
    let comment = '';
    const purposeMatch = text.match(/(?:purpose|призначення|comment|note)=([^|&]+)/i);
    if (purposeMatch) {
      try {
        comment = decodeURIComponent(purposeMatch[1].trim());
      } catch {
        comment = purposeMatch[1].trim();
      }
    }

    // Extract recipient name
    let recipientName = '';
    const nameMatch = text.match(/(?:name|recipient|одержувач|назва|наименование)=([^|&]+)/i);
    if (nameMatch) {
      try {
        recipientName = decodeURIComponent(nameMatch[1].trim());
      } catch {
        recipientName = nameMatch[1].trim();
      }
    }

    // Extract recipient tax ID / EDRPOU / OKPO
    let taxId = '';
    const codeMatch = text.match(/(?:edrpou|okpo|код|іпн|taxid|code)=([^|&]+)/i);
    if (codeMatch) {
      taxId = codeMatch[1].trim();
    }

    return {
      type: 'iban',
      targetNumber: iban,
      amount: amountStr || undefined,
      comment: comment || undefined,
      recipientName: recipientName || undefined,
      taxId: taxId || undefined,
      raw: text
    };
  }

  // 2. Card Number P2P (13-19 digits, e.g. 4441 1111 2222 3333 or monobank/privat links)
  const cardRegex = /\b(?:\d[ -]*?){13,19}\b/;
  const cardMatch = text.match(cardRegex);
  if (cardMatch) {
    const rawCard = cardMatch[0].replace(/\D/g, '');
    if (rawCard.length >= 13 && rawCard.length <= 19) {
      // Check if amount is present in URL or query e.g. amount=100
      let amountStr = '';
      const amountMatch = text.match(/(?:amount|sum|a)=([\d.,]+)/i);
      if (amountMatch) {
        amountStr = amountMatch[1].replace(',', '.');
      }

      return {
        type: 'card',
        targetNumber: rawCard,
        amount: amountStr || undefined,
        raw: text
      };
    }
  }

  // 3. Phone number (+380... or 067...)
  const phoneRegex = /(?:\+?38)?(0\d{9})/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    return {
      type: 'mobile',
      targetNumber: `+38${phoneMatch[1]}`,
      raw: text
    };
  }

  // 4. Utility Barcode / Account number (e.g., EDRPOU or bill identifier)
  // Clean special characters if needed
  const sanitized = text.replace(/[^\w\d\s-]/gi, '').trim();

  return {
    type: 'iban',
    targetNumber: sanitized || text,
    raw: text
  };
}
