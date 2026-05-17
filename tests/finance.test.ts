import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFinanceModel, detectRecurring, type Account, type Transaction } from '../src/domain/finance';
import { parseTransactionCsv, parseUpiBulkText, parseUpiText } from '../src/domain/upi';

const account: Account = {
  user_id: '00000000-0000-0000-0000-000000000000',
  currency: 'INR',
  currency_symbol: '₹',
  balance: 5000,
  balance_known: true,
};

test('forecast blocks insufficient data', () => {
  const model = buildFinanceModel({ account, transactions: [{ type: 'debit', amount: 250, merchant_name: 'Cafe', category_id: 'food', date: '2026-05-17', source: 'manual' }], now: new Date('2026-05-17') });
  assert.equal(model.ready, false);
  assert.match(model.reasons.join(' '), /At least 5 real transactions/);
  assert.equal(model.confidence, 0);
});

test('forecast is deterministic once data gates pass', () => {
  const transactions: Transaction[] = Array.from({ length: 8 }, (_, index) => ({
    type: index === 1 ? 'credit' : 'debit',
    amount: index === 1 ? 2000 : 100 + index,
    merchant_name: index === 1 ? 'Allowance' : `Merchant ${index}`,
    category_id: index === 1 ? 'income' : 'food',
    date: `2026-05-${String(index + 1).padStart(2, '0')}`,
    source: 'manual',
  }));
  const model = buildFinanceModel({ account, transactions, now: new Date('2026-05-17') });
  assert.equal(model.ready, true);
  assert.ok(model.confidence > 0);
  assert.ok(Number.isFinite(model.projected));
});

test('recurring detection needs stable merchant timing and amount', () => {
  const rows: Transaction[] = [
    { type: 'debit', amount: 499, merchant_name: 'Spotify', category_id: 'subscriptions', date: '2026-01-05', source: 'manual' },
    { type: 'debit', amount: 499, merchant_name: 'Spotify', category_id: 'subscriptions', date: '2026-02-05', source: 'manual' },
    { type: 'debit', amount: 499, merchant_name: 'Spotify', category_id: 'subscriptions', date: '2026-03-06', source: 'manual' },
  ];
  const recurring = detectRecurring(rows);
  assert.equal(recurring.length, 1);
  assert.equal(recurring[0].cadence, 'monthly');
});

test('UPI parser requires reference grounding', () => {
  const rejected = parseUpiText('Paid to Cafe Nova yesterday');
  assert.equal(rejected.ok, false);
  assert.match(rejected.error || '', /Amount not found/);
  const accepted = parseUpiText('Paid ₹250 to Cafe Nova on 17/05/2026 UPI Ref No 612345678901');
  assert.equal(accepted.ok, true);
  assert.equal(accepted.transaction?.external_ref, '612345678901');
});

test('CSV import accepts valid rows and rejects invalid rows', () => {
  const csv = ['date,description,debit,credit,utr', '17/05/2026,GPay to Cafe Nova,250,,612345678901', 'bad row,,,,'].join('\n');
  const result = parseTransactionCsv(csv);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.rejected.length, 1);
});

test('bulk UPI import parses multiple receipt lines', () => {
  const result = parseUpiBulkText([
    'Paid ₹250 to Cafe Nova on 17/05/2026 UPI Ref No 612345678901',
    'Paid ₹80 to Metro on 16/05/2026 UTR 612345678902',
    'invalid entry',
  ].join('\n'));
  assert.equal(result.accepted.length, 2);
  assert.equal(result.rejected.length, 1);
});
