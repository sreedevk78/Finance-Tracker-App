import { classifyTransaction, cleanText, dateOnly, moneyNumber, type Transaction } from './finance';

const VPA_PATTERN = /[a-zA-Z0-9._-]+@[a-zA-Z][a-zA-Z0-9._-]*/;
const REF_PATTERN = /\b(?:upi\s*(?:ref(?:erence)?|transaction)?\s*(?:no|id|number)?|utr|rrn|ref(?:erence)?(?:\s*no)?|transaction\s*id)\s*[:#-]?\s*([0-9A-Za-z-]{8,32})\b/i;
const AMOUNT_PATTERN = /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;

export interface ParsedImport {
  ok: boolean;
  transaction?: Transaction;
  facts?: string[];
  error?: string;
}

export function parseUpiText(rawText: string, now = new Date()): ParsedImport {
  const text = String(rawText || '').replace(/\r/g, '\n').trim();
  if (!text) return { ok: false, error: 'Paste a Google Pay receipt, UPI SMS, or bank narration first.' };
  const normalized = text.replace(/\s+/g, ' ');
  const amountMatch = normalized.match(AMOUNT_PATTERN);
  const amount = amountMatch ? moneyNumber(amountMatch[1]) : 0;
  const refMatch = normalized.match(REF_PATTERN);
  const externalRef = refMatch ? cleanText(refMatch[1]).replace(/[^\w-]/g, '') : '';
  const vpaMatch = normalized.match(VPA_PATTERN);
  const vpa = vpaMatch ? cleanText(vpaMatch[0]).toLowerCase() : '';
  const type = inferDirection(normalized);
  const date = inferDate(normalized, now);
  const merchantName = inferCounterparty(normalized, type, vpa);
  const errors: string[] = [];
  if (!amount || amount <= 0) errors.push('Amount not found. Include a receipt or narration containing ₹, Rs, or INR amount.');
  if (!externalRef) errors.push('UPI reference/UTR/RRN not found. Aura needs this to link and deduplicate the transaction.');
  if (!date) errors.push('Transaction date not found. Include a date from the receipt, SMS, or statement narration.');
  if (!merchantName) errors.push('Counterparty not found. Include the payee, payer, merchant, or VPA.');
  if (errors.length) return { ok: false, error: errors.join(' ') };
  const transaction: Transaction = {
    type,
    amount,
    merchant_name: merchantName,
    category_id: classifyTransaction({ merchant_name: merchantName, note: normalized, type, source: 'gpay_upi_import' }),
    date,
    note: cleanText(text),
    source: 'gpay_upi_import',
    external_ref: externalRef,
    vpa,
  };
  return {
    ok: true,
    transaction,
    facts: [`Parsed ${type} of ₹${amount}`, `UPI reference ${externalRef}`, vpa ? `VPA ${vpa}` : 'No VPA in text', `Date ${date}`],
  };
}

export function parseTransactionCsv(csvText: string) {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return { accepted: [] as Transaction[], rejected: [{ row: 1, error: 'CSV must include a header and at least one data row.' }] };
  const headers = rows[0].map((header) => normalizeHeader(header));
  const accepted: Transaction[] = [];
  const rejected: Array<{ row: number; error: string }> = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const raw = rows[rowIndex];
    if (!raw.some((value) => String(value || '').trim())) continue;
    const row = Object.fromEntries(headers.map((header, index) => [header, raw[index] || '']));
    const parsed = rowToTransaction(row);
    if (parsed.ok && parsed.transaction) accepted.push(parsed.transaction);
    else rejected.push({ row: rowIndex + 1, error: parsed.error || 'Invalid row' });
  }
  return { accepted, rejected };
}

export function parseUpiBulkText(rawText: string, now = new Date()) {
  const text = String(rawText || '').trim();
  if (!text) return { accepted: [] as Transaction[], rejected: [{ row: 1, error: 'Paste one or more UPI/GPay receipts, SMS messages, or bank narrations.' }] };
  const chunks = splitUpiChunks(text);
  const accepted: Transaction[] = [];
  const rejected: Array<{ row: number; error: string }> = [];
  chunks.forEach((chunk, index) => {
    const parsed = parseUpiText(chunk, now);
    if (parsed.ok && parsed.transaction) accepted.push(parsed.transaction);
    else rejected.push({ row: index + 1, error: parsed.error || 'Could not parse transaction.' });
  });
  return { accepted, rejected };
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  const input = String(text || '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(value.trim());
      value = '';
    } else if (char === '\n') {
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') value += char;
  }
  row.push(value.trim());
  if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function splitUpiChunks(text: string) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) return [text];
  const chunks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    const startsNew = Boolean(line.match(AMOUNT_PATTERN) && (line.match(REF_PATTERN) || /\b(paid|sent|received|credited|debited)\b/i.test(line)));
    if (startsNew && current.length) {
      chunks.push(current.join(' '));
      current = [line];
    } else if (!startsNew && current.length && current.join(' ').match(AMOUNT_PATTERN) && current.join(' ').match(REF_PATTERN)) {
      chunks.push(current.join(' '));
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) chunks.push(current.join(' '));
  return chunks.length ? chunks : [text];
}

function rowToTransaction(row: Record<string, string>): ParsedImport {
  const date = parseCsvDate(row.date || row.transaction_date || row.txn_date || row.value_date);
  const description = cleanText(row.merchant || row.description || row.narration || row.particulars || row.payee || row.payer);
  const ref = cleanText(row.upi_ref || row.utr || row.rrn || row.reference || row.ref || row.transaction_id);
  const vpaMatch = `${description} ${row.vpa || ''}`.match(VPA_PATTERN);
  const vpa = vpaMatch ? cleanText(vpaMatch[0]).toLowerCase() : '';
  const debit = moneyNumber(row.debit || row.withdrawal || row.paid || '');
  const credit = moneyNumber(row.credit || row.deposit || row.received || '');
  const signedAmount = moneyNumber(row.amount || '');
  const direction = cleanText(row.type || row.direction || '').toLowerCase();
  const type = credit > 0 || direction.includes('credit') || direction.includes('received') ? 'credit' : 'debit';
  const amount = credit > 0 ? credit : debit > 0 ? debit : Math.abs(signedAmount);
  const merchantName = description || (vpa ? `UPI ${vpa}` : '');
  const errors: string[] = [];
  if (!date) errors.push('missing valid date');
  if (!amount) errors.push('missing amount');
  if (!merchantName) errors.push('missing merchant/description');
  if (errors.length) return { ok: false, error: errors.join(', ') };
  return {
    ok: true,
    transaction: {
      type,
      amount,
      merchant_name: merchantName,
      category_id: classifyTransaction({ merchant_name: merchantName, note: description, type, source: 'csv_import' }),
      date,
      note: description,
      source: ref || vpa ? 'upi_csv_import' : 'csv_import',
      external_ref: ref,
      vpa,
    },
  };
}

function inferDirection(text: string): Transaction['type'] {
  return /\b(received|credited|credit|refund|cashback|deposited)\b/i.test(text) ? 'credit' : 'debit';
}

function inferCounterparty(text: string, type: Transaction['type'], vpa: string) {
  const patterns = type === 'credit'
    ? [/\b(?:received\s+from|credited\s+from|from)\s+([A-Za-z0-9 ._&@-]{3,80})/i]
    : [/\b(?:paid\s+to|sent\s+to|debited\s+to|to)\s+([A-Za-z0-9 ._&@-]{3,80})/i, /\bat\s+([A-Za-z0-9 ._&@-]{3,80})/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = cleanText(match[1].replace(AMOUNT_PATTERN, '').replace(REF_PATTERN, '').replace(/\b(on|upi|ref|utr|rrn|txn|transaction)\b.*$/i, ''));
      if (cleaned && !/^(your|account|bank)$/i.test(cleaned)) return cleaned;
    }
  }
  return vpa ? `UPI ${vpa}` : '';
}

function inferDate(text: string, now: Date) {
  const iso = text.match(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
  if (iso) return dateOnly(`${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`);
  const indian = text.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2}|\d{2})\b/);
  if (indian) {
    const year = indian[3].length === 2 ? `20${indian[3]}` : indian[3];
    return dateOnly(`${year}-${indian[2].padStart(2, '0')}-${indian[1].padStart(2, '0')}`);
  }
  const named = text.match(/\b(0?[1-9]|[12]\d|3[01])\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(20\d{2})\b/i);
  if (named) {
    const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].indexOf(named[2].slice(0, 3).toLowerCase()) + 1;
    return dateOnly(`${named[3]}-${String(month).padStart(2, '0')}-${named[1].padStart(2, '0')}`);
  }
  return /\btoday\b/i.test(text) ? dateOnly(now) : '';
}

function parseCsvDate(value: string) {
  const text = cleanText(value);
  if (!text) return '';
  return inferDate(text, new Date()) || (Number.isNaN(new Date(text).getTime()) ? '' : dateOnly(text));
}

function normalizeHeader(value: string) {
  return cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
