export type Lifestyle = 'student' | 'freelancer' | 'salaried' | 'business_owner' | 'custom';
export type CashflowCadence =
  | 'allowance'
  | 'scholarship'
  | 'part_time'
  | 'none'
  | 'unknown'
  | 'irregular'
  | 'project'
  | 'monthly'
  | 'biweekly'
  | 'fixed'
  | 'business'
  | 'weekly';
export type TransactionType = 'debit' | 'credit' | 'transfer';

export interface Profile {
  id?: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  lifestyle: Lifestyle;
  cashflow_cadence: CashflowCadence;
  expected_monthly_inflow: number | null;
  onboarding_completed_at?: string | null;
}

export interface Account {
  id?: string;
  user_id: string;
  currency: string;
  currency_symbol: string;
  balance: number;
  balance_known: boolean;
  balance_updated_at?: string | null;
}

export interface Transaction {
  id?: string;
  user_id?: string;
  type: TransactionType;
  amount: number;
  merchant_name: string;
  category_id: string;
  date: string;
  note?: string | null;
  source: string;
  external_ref?: string | null;
  vpa?: string | null;
  created_at?: string;
}

export interface Goal {
  id?: string;
  user_id?: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string | null;
  status?: 'active' | 'paused' | 'completed';
  created_at?: string;
}

type DbRow = Record<string, unknown>;

export interface Insight {
  title: string;
  body: string;
  severity: 'info' | 'caution' | 'high';
  confidence: number;
  facts: string[];
}

export interface FinanceModel {
  ready: boolean;
  reasons: string[];
  coverageDays: number;
  activeDays: number;
  monthSpend: number;
  monthIncome: number;
  monthNet: number;
  dailySpend: number;
  dailyIncome: number;
  projected: number;
  low: number;
  high: number;
  confidence: number;
  health: number;
  runwayDays: number | null;
  recurring: RecurringCharge[];
  recurringLoad: number;
  categoryBreakdown: CategoryBreakdown[];
  anomalies: TransactionAnomaly[];
  insights: Insight[];
  assumptions: string[];
}

export interface RecurringCharge {
  merchant: string;
  amount: number;
  cadence: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  confidence: number;
  observations: number;
  lastDate: string;
  source: string;
}

export interface CategoryBreakdown {
  id: string;
  label: string;
  tone: string;
  amount: number;
  share: number;
}

export interface TransactionAnomaly extends Transaction {
  threshold: number;
}

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee' },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', locale: 'en-IE', label: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', locale: 'ja-JP', label: 'Japanese Yen' },
  AUD: { code: 'AUD', symbol: 'A$', locale: 'en-AU', label: 'Australian Dollar' },
} as const;

export const LIFESTYLES: Record<Lifestyle, { label: string; summary: string; defaultGoal: string }> = {
  student: {
    label: 'Student',
    summary: 'Allowance, scholarships, family support, part-time income, or no income.',
    defaultGoal: 'Protect my monthly essentials',
  },
  freelancer: {
    label: 'Freelancer',
    summary: 'Project invoices, uneven payments, and variable buffers.',
    defaultGoal: 'Stabilize my cash buffer',
  },
  salaried: {
    label: 'Salaried professional',
    summary: 'Fixed salary cycles, recurring bills, and planned goals.',
    defaultGoal: 'Grow a reliable emergency fund',
  },
  business_owner: {
    label: 'Business owner',
    summary: 'Variable business cashflow, operating expenses, and owner draws.',
    defaultGoal: 'Separate operating cash from personal spend',
  },
  custom: {
    label: 'Custom lifestyle',
    summary: 'A mixed or changing setup Aura should learn over time.',
    defaultGoal: 'Understand my money pattern',
  },
};

export const CADENCES: Record<CashflowCadence, string> = {
  allowance: 'Allowance or family support',
  scholarship: 'Scholarship support',
  part_time: 'Part-time income',
  none: 'No income right now',
  unknown: 'Unknown or changing',
  irregular: 'Irregular income',
  project: 'Project-based income',
  monthly: 'Monthly',
  biweekly: 'Biweekly',
  fixed: 'Fixed salary',
  business: 'Business cashflow',
  weekly: 'Weekly',
};

export const CATEGORIES: Record<string, { label: string; tone: string; keywords: string[] }> = {
  food: { label: 'Food', tone: '#b85c38', keywords: ['swiggy', 'zomato', 'cafe', 'restaurant', 'food', 'grocery', 'mess', 'canteen'] },
  shopping: { label: 'Shopping', tone: '#8060a8', keywords: ['amazon', 'flipkart', 'myntra', 'store', 'shop', 'retail'] },
  transport: { label: 'Transport', tone: '#2f7a78', keywords: ['uber', 'ola', 'metro', 'fuel', 'petrol', 'bus', 'train', 'irctc'] },
  bills: { label: 'Bills', tone: '#a77b2c', keywords: ['rent', 'electricity', 'utility', 'internet', 'phone', 'bill', 'airtel', 'jio'] },
  subscriptions: { label: 'Subscriptions', tone: '#4f72c8', keywords: ['netflix', 'spotify', 'prime', 'subscription', 'icloud', 'google one'] },
  education: { label: 'Education', tone: '#3f69a8', keywords: ['college', 'school', 'course', 'tuition', 'book', 'exam'] },
  health: { label: 'Health', tone: '#4e8b55', keywords: ['pharmacy', 'doctor', 'clinic', 'medical', 'hospital', 'gym'] },
  transfers: { label: 'Transfers', tone: '#606976', keywords: ['transfer', 'upi', 'self', 'wallet'] },
  income: { label: 'Income', tone: '#2b8c66', keywords: ['salary', 'stipend', 'allowance', 'payroll', 'invoice', 'received'] },
  other: { label: 'Other', tone: '#6d7480', keywords: [] },
};

export function currencyInfo(code = 'INR') {
  return CURRENCIES[String(code).toUpperCase() as keyof typeof CURRENCIES] || CURRENCIES.INR;
}

export function moneyNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const normalized = String(value).replace(/[₹$,€£,\s]/g, '').replace(/^Rs\.?/i, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function normalizeProfileRow(row: unknown): Profile | null {
  const record = asRecord(row);
  if (!record) return null;
  const lifestyle = readString(record, 'lifestyle') || readString(record, 'financial_persona');
  const cadence = readString(record, 'cashflow_cadence');
  return {
    id: readOptionalString(record, 'id'),
    user_id: readString(record, 'user_id'),
    full_name: readOptionalString(record, 'full_name'),
    email: readOptionalString(record, 'email'),
    lifestyle: isLifestyle(lifestyle) ? lifestyle : 'custom',
    cashflow_cadence: isCashflowCadence(cadence) ? cadence : 'unknown',
    expected_monthly_inflow: nullableNumber(record.expected_monthly_inflow ?? record.monthly_income),
    onboarding_completed_at: readOptionalString(record, 'onboarding_completed_at'),
  };
}

export function normalizeAccountRow(row: unknown): Account | null {
  const record = asRecord(row);
  if (!record) return null;
  const currency = readString(record, 'currency') || 'INR';
  const info = currencyInfo(currency);
  return {
    id: readOptionalString(record, 'id'),
    user_id: readString(record, 'user_id'),
    currency: info.code,
    currency_symbol: readString(record, 'currency_symbol') || info.symbol,
    balance: moneyNumber(record.balance ?? record.current_balance),
    balance_known: Boolean(record.balance_known ?? true),
    balance_updated_at: readOptionalString(record, 'balance_updated_at'),
  };
}

export function normalizeTransactionRow(row: unknown): Transaction | null {
  const record = asRecord(row);
  if (!record) return null;
  const normalized = normalizeTransaction({
    id: readOptionalString(record, 'id'),
    user_id: readOptionalString(record, 'user_id'),
    type: isTransactionType(readString(record, 'type')) ? readString(record, 'type') as TransactionType : readString(record, 'transaction_type') as TransactionType,
    amount: moneyNumber(record.amount),
    merchant_name: readString(record, 'merchant_name') || readString(record, 'description'),
    category_id: readString(record, 'category_id'),
    date: readString(record, 'date') || readString(record, 'transaction_date') || readString(record, 'created_at'),
    note: readString(record, 'note') || readString(record, 'description'),
    source: readString(record, 'source') || 'manual',
    external_ref: readString(record, 'external_ref'),
    vpa: readString(record, 'vpa'),
    created_at: readOptionalString(record, 'created_at') || undefined,
  });
  if (!normalized) return null;
  return normalized;
}

export function normalizeGoalRow(row: unknown): Goal | null {
  const record = asRecord(row);
  if (!record) return null;
  const title = cleanText(record.title);
  const target = moneyNumber(record.target_amount);
  if (!title || target <= 0) return null;
  return {
    id: readOptionalString(record, 'id'),
    user_id: readOptionalString(record, 'user_id'),
    title,
    target_amount: target,
    current_amount: moneyNumber(record.current_amount),
    deadline: readOptionalString(record, 'deadline')?.slice(0, 10) || null,
    status: ['active', 'paused', 'completed'].includes(readString(record, 'status')) ? readString(record, 'status') as Goal['status'] : 'active',
    created_at: readOptionalString(record, 'created_at') || undefined,
  };
}

export function formatMoney(value: number, account?: Partial<Account>) {
  const amount = Number(value) || 0;
  const info = currencyInfo(account?.currency || 'INR');
  const abs = Math.abs(amount);
  return `${account?.currency_symbol || info.symbol}${abs.toLocaleString(info.locale, {
    minimumFractionDigits: abs > 0 && abs < 100 ? 2 : 0,
    maximumFractionDigits: abs < 100 ? 2 : 0,
  })}`;
}

export function signedMoney(value: number, account?: Partial<Account>) {
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatMoney(value, account)}`;
}

export function todayISO(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateOnly(value: unknown) {
  const raw = String(value || '').trim();
  const plainDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (plainDate) return `${plainDate[1]}-${plainDate[2]}-${plainDate[3]}`;
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) return todayISO();
  return todayISO(date);
}

export function classifyTransaction(input: { merchant_name?: string; note?: string | null; type?: TransactionType; source?: string }) {
  if (input.type === 'credit') return 'income';
  const text = `${input.merchant_name || ''} ${input.note || ''} ${input.source || ''}`.toLowerCase();
  for (const [id, category] of Object.entries(CATEGORIES)) {
    if (id !== 'income' && category.keywords.some((keyword) => text.includes(keyword))) return id;
  }
  if (text.includes('@') || text.includes('upi')) return 'transfers';
  return 'other';
}

export function normalizeTransaction(input: Partial<Transaction>): Transaction | null {
  const amount = moneyNumber(input.amount);
  const merchantName = cleanText(input.merchant_name || '');
  const date = dateOnly(input.date);
  const type = ['debit', 'credit', 'transfer'].includes(String(input.type)) ? input.type as TransactionType : 'debit';
  if (!amount || !merchantName || !date) return null;
  const category = input.category_id || classifyTransaction({ merchant_name: merchantName, note: input.note, type, source: input.source });
  return {
    ...input,
    type,
    amount: Math.abs(amount),
    merchant_name: merchantName,
    category_id: CATEGORIES[category] ? category : type === 'credit' ? 'income' : 'other',
    date,
    note: cleanText(input.note || ''),
    source: input.source || 'manual',
    external_ref: cleanText(input.external_ref || ''),
    vpa: cleanText(input.vpa || ''),
  };
}

export function buildFinanceModel(input: {
  account: Account | null;
  transactions: Transaction[];
  goals?: Goal[];
  now?: Date;
}): FinanceModel {
  const account = input.account;
  const transactions = [...input.transactions].map((tx) => normalizeTransaction(tx)).filter(Boolean) as Transaction[];
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const now = input.now || new Date();
  const debits = transactions.filter((tx) => tx.type === 'debit');
  const credits = transactions.filter((tx) => tx.type === 'credit');
  const firstDate = transactions[0] ? startDay(transactions[0].date) : null;
  const coverageDays = firstDate ? Math.max(1, daysBetween(firstDate, now) + 1) : 0;
  const activeDays = new Set(transactions.map((tx) => tx.date)).size;
  const monthRows = transactions.filter((tx) => {
    const d = new Date(tx.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthSpend = sum(monthRows.filter((tx) => tx.type === 'debit').map((tx) => tx.amount));
  const monthIncome = sum(monthRows.filter((tx) => tx.type === 'credit').map((tx) => tx.amount));
  const recurring = detectRecurring(transactions);
  const dailySpend = coverageDays ? sum(debits.map((tx) => tx.amount)) / coverageDays : 0;
  const dailyIncome = coverageDays ? sum(credits.map((tx) => tx.amount)) / coverageDays : 0;
  const dailyNet = dailySeries(transactions, firstDate || startDay(now), startDay(now)).map((row) => row.credit - row.debit);
  const volatility = standardDeviation(dailyNet);
  const reasons: string[] = [];
  if (!account?.balance_known) reasons.push('Add a verified current balance anchor. A zero balance is valid if it is marked as known.');
  if (transactions.length < 5) reasons.push(`At least 5 real transactions are required; ${transactions.length} are available.`);
  if (coverageDays < 7) reasons.push(`At least 7 calendar days of history are required; ${coverageDays} days are available.`);
  if (activeDays < 2) reasons.push(`At least 2 active transaction days are required; ${activeDays} are available.`);
  const ready = reasons.length === 0;
  const recurringLoad = ready ? sum(recurringDueWithin(recurring, now, 30).map((row) => row.amount)) : 0;
  const balance = account?.balance || 0;
  const projected = ready ? roundMoney(balance + (dailyIncome - dailySpend) * 30 - recurringLoad) : balance;
  const confidence = ready ? confidenceScore({ count: transactions.length, coverageDays, activeDays, volatility, recurringCount: recurring.length }) : 0;
  const spread = ready ? roundMoney(Math.max(25, volatility * 8 + Math.abs(projected) * (1 - confidence / 100) * 0.22)) : 0;
  const runwayDays = ready && dailySpend > dailyIncome ? Math.max(0, Math.floor(balance / Math.max(1, dailySpend - dailyIncome))) : null;
  const categoryBreakdown = breakdownByCategory(monthRows);
  const anomalies = detectAnomalies(transactions);
  const health = ready ? healthScore({ monthIncome, monthSpend, balance, dailySpend, anomalies: anomalies.length }) : 0;
  const modelBase = {
    ready,
    reasons,
    coverageDays,
    activeDays,
    monthSpend,
    monthIncome,
    monthNet: monthIncome - monthSpend,
    dailySpend,
    dailyIncome,
    projected,
    low: projected - spread,
    high: projected + spread,
    confidence,
    health,
    runwayDays,
    recurring,
    recurringLoad,
    categoryBreakdown,
    anomalies,
    assumptions: [
      `${transactions.length} verified transaction${transactions.length === 1 ? '' : 's'}`,
      `${coverageDays} calendar day${coverageDays === 1 ? '' : 's'} of history`,
      `${activeDays} active transaction day${activeDays === 1 ? '' : 's'}`,
      account?.balance_known ? `${formatMoney(balance, account)} verified balance anchor` : 'No verified balance anchor',
      ready ? `${confidence}% deterministic confidence score` : 'Forecast blocked by data-quality rules',
    ],
  };
  return { ...modelBase, insights: buildInsights(modelBase, account) };
}

export function detectRecurring(transactions: Transaction[]): RecurringCharge[] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions.filter((item) => item.type === 'debit')) {
    const key = cleanText(tx.merchant_name).toLowerCase().replace(/[^a-z0-9@]+/g, ' ').trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  const recurring: RecurringCharge[] = [];
  for (const rows of groups.values()) {
    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (rows.length < 2) continue;
    const gaps = rows.slice(1).map((row, index) => Math.abs(daysBetween(rows[index].date, row.date))).filter((gap) => gap > 0);
    if (!gaps.length) continue;
    const avgGap = average(gaps);
    const avgAmount = average(rows.map((row) => row.amount));
    const amountVariance = average(rows.map((row) => Math.abs(row.amount - avgAmount)));
    const stableAmount = amountVariance <= Math.max(5, avgAmount * 0.12);
    const stableGap = standardDeviation(gaps) <= Math.max(4, avgGap * 0.35);
    if (!stableAmount || !stableGap) continue;
    recurring.push({
      merchant: rows.at(-1)!.merchant_name,
      amount: roundMoney(avgAmount),
      cadence: avgGap <= 10 ? 'weekly' : avgGap <= 40 ? 'monthly' : avgGap <= 105 ? 'quarterly' : 'annual',
      confidence: Math.min(94, Math.round(38 + rows.length * 15 + 12 + 10)),
      observations: rows.length,
      lastDate: rows.at(-1)!.date,
      source: rows.some((row) => row.source.includes('upi') || row.source.includes('gpay')) ? 'upi-linked' : 'observed',
    });
  }
  return recurring.sort((a, b) => b.confidence - a.confidence);
}

export function recurringDueWithin(recurring: RecurringCharge[], now = new Date(), days = 30) {
  return recurring.filter((item) => {
    const next = nextRecurringDate(item.lastDate, item.cadence);
    return daysBetween(now, next) >= 0 && daysBetween(now, next) <= days;
  });
}

export function nextRecurringDate(lastDate: string, cadence: RecurringCharge['cadence']) {
  const date = new Date(lastDate);
  if (cadence === 'weekly') date.setDate(date.getDate() + 7);
  else if (cadence === 'quarterly') date.setMonth(date.getMonth() + 3);
  else if (cadence === 'annual') date.setFullYear(date.getFullYear() + 1);
  else date.setMonth(date.getMonth() + 1);
  return date;
}

export function breakdownByCategory(rows: Transaction[]): CategoryBreakdown[] {
  const spend = sum(rows.filter((tx) => tx.type === 'debit').map((tx) => tx.amount));
  return Object.entries(CATEGORIES)
    .filter(([id]) => id !== 'income')
    .map(([id, category]) => ({
      id,
      label: category.label,
      tone: category.tone,
      amount: sum(rows.filter((tx) => tx.type === 'debit' && tx.category_id === id).map((tx) => tx.amount)),
      share: 0,
    }))
    .map((row) => ({ ...row, share: spend ? row.amount / spend : 0 }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function detectAnomalies(transactions: Transaction[]): TransactionAnomaly[] {
  const debitAmounts = transactions.filter((tx) => tx.type === 'debit').map((tx) => tx.amount);
  if (debitAmounts.length < 6) return [];
  const median = percentile(debitAmounts, 0.5);
  const p90 = percentile(debitAmounts, 0.9);
  const threshold = Math.max(p90, median * 2.5);
  return transactions
    .filter((tx) => tx.type === 'debit' && tx.amount >= threshold)
    .map((tx) => ({ ...tx, threshold }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
}

export function coachResponse(question: string, account: Account | null, model: FinanceModel, transactions: Transaction[], goals: Goal[]) {
  const text = cleanText(question).toLowerCase();
  if (!text) return { text: 'Ask a question about verified spending, forecast, recurring charges, goals, or UPI/GPay imports.', confidence: 0, facts: [] as string[] };
  if (text.includes('gpay') || text.includes('upi') || text.includes('google pay')) {
    const linked = transactions.filter((tx) => tx.source.includes('gpay') || tx.source.includes('upi')).length;
    return {
      confidence: 92,
      text: 'Aura supports UPI/GPay import by receipt, SMS, statement narration, UTR/RRN, and VPA. It does not pretend to access personal Google Pay history directly.',
      facts: [`${linked} UPI/GPay-linked transactions`, 'Duplicate references are rejected'],
    };
  }
  if (!model.ready && /(forecast|future|runway|afford|predict|projection|balance)/.test(text)) {
    return { confidence: 100, text: `I cannot produce a forecast yet: ${model.reasons.join(' ')}`, facts: model.reasons };
  }
  if (/(forecast|future|runway|afford|predict|projection|balance)/.test(text)) {
    return {
      confidence: model.confidence,
      text: model.runwayDays === null
        ? 'Observed income is currently covering observed daily spend in this data window.'
        : `At the current observed burn rate, estimated runway is ${model.runwayDays} days.`,
      facts: [`Projected balance ${formatMoney(model.projected, account || undefined)}`, `Range ${formatMoney(model.low, account || undefined)} to ${formatMoney(model.high, account || undefined)}`, `${model.confidence}% confidence`],
    };
  }
  if (/(spend|category|where)/.test(text)) {
    const top = model.categoryBreakdown[0];
    if (!top) return { confidence: 100, text: 'There is no categorized debit spend in the current month yet.', facts: ['No current-month debit categories found.'] };
    return {
      confidence: Math.max(50, model.confidence || 70),
      text: `${top.label} is the largest observed spending driver this month at ${Math.round(top.share * 100)}% of debit spend.`,
      facts: [`${formatMoney(top.amount, account || undefined)} in ${top.label}`, `${formatMoney(model.monthSpend, account || undefined)} total debit spend`],
    };
  }
  if (/(recurring|subscription)/.test(text)) {
    const top = model.recurring[0];
    if (!top) return { confidence: 100, text: 'No recurring charge has enough repeated, stable observations yet.', facts: ['Recurring detection needs repeated merchant charges with stable timing and amount.'] };
    return {
      confidence: top.confidence,
      text: `${top.merchant} is the strongest recurring pattern detected.`,
      facts: [`${formatMoney(top.amount, account || undefined)} ${top.cadence}`, `${top.confidence}% confidence from ${top.observations} observations`],
    };
  }
  if (/(goal|save)/.test(text)) {
    const goal = goals[0];
    if (!goal) return { confidence: 100, text: 'No goals are configured yet. Add a goal before asking for goal tradeoffs.', facts: ['0 active goals'] };
    return {
      confidence: model.ready ? model.confidence : 80,
      text: `${goal.title} needs ${formatMoney(Math.max(0, goal.target_amount - goal.current_amount), account || undefined)} more.`,
      facts: [`${formatMoney(goal.current_amount, account || undefined)} saved`, `${formatMoney(goal.target_amount, account || undefined)} target`],
    };
  }
  return {
    confidence: model.ready ? Math.min(model.confidence, 72) : 60,
    text: 'I can answer from verified transactions, goals, recurring patterns, forecasts, and UPI/GPay import status. I do not have enough grounded context for that exact question.',
    facts: model.assumptions,
  };
}

function buildInsights(model: Omit<FinanceModel, 'insights'>, account: Account | null): Insight[] {
  if (!model.ready) {
    return [{ title: 'Forecast blocked until data quality improves', body: model.reasons[0], severity: 'info', confidence: 100, facts: model.reasons }];
  }
  const insights: Insight[] = [];
  if (model.projected < 0) {
    insights.push({
      title: 'Projected balance can turn negative',
      body: `The 30-day projection is ${formatMoney(model.projected, account || undefined)}.`,
      severity: 'high',
      confidence: model.confidence,
      facts: [`${model.coverageDays} days of history`, `${model.activeDays} active days`],
    });
  } else if (model.runwayDays !== null && model.runwayDays < 21) {
    insights.push({
      title: 'Runway is under three weeks',
      body: `Observed spend is outpacing observed income, giving an estimated runway of ${model.runwayDays} days.`,
      severity: 'caution',
      confidence: model.confidence,
      facts: [`Spend ${formatMoney(model.monthSpend, account || undefined)}`, `Income ${formatMoney(model.monthIncome, account || undefined)}`],
    });
  }
  if (model.categoryBreakdown[0]) {
    const top = model.categoryBreakdown[0];
    insights.push({
      title: `${top.label} is the largest driver`,
      body: `${top.label} accounts for ${Math.round(top.share * 100)}% of observed debit spend this month.`,
      severity: top.share >= 0.45 ? 'caution' : 'info',
      confidence: Math.max(60, model.confidence - 8),
      facts: [`${formatMoney(top.amount, account || undefined)} in ${top.label}`, `${formatMoney(model.monthSpend, account || undefined)} total spend`],
    });
  }
  if (model.recurring[0]) {
    const top = model.recurring[0];
    insights.push({
      title: `${top.merchant} looks recurring`,
      body: `Detected ${top.cadence} charges around ${formatMoney(top.amount, account || undefined)}.`,
      severity: 'info',
      confidence: top.confidence,
      facts: [`${top.observations} observations`, `${top.source}`],
    });
  }
  if (model.anomalies[0]) {
    insights.push({
      title: `${model.anomalies[0].merchant_name} is unusually large`,
      body: `${formatMoney(model.anomalies[0].amount, account || undefined)} is above the high-spend threshold.`,
      severity: 'caution',
      confidence: Math.max(65, model.confidence - 10),
      facts: [`Threshold ${formatMoney(model.anomalies[0].threshold, account || undefined)}`],
    });
  }
  return insights.length ? insights.slice(0, 6) : [{
    title: 'No high-confidence risk signal yet',
    body: 'The current data does not show a negative projection, dominant anomaly, or recurring charge risk.',
    severity: 'info',
    confidence: model.confidence,
    facts: [`${model.coverageDays} days of real history`, `${model.confidence}% confidence`],
  }];
}

function dailySeries(transactions: Transaction[], firstDate: Date, now: Date) {
  const days = Math.max(1, daysBetween(firstDate, now) + 1);
  const map = new Map<string, { date: string; debit: number; credit: number }>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(firstDate);
    date.setDate(date.getDate() + i);
    map.set(todayISO(date), { date: todayISO(date), debit: 0, credit: 0 });
  }
  for (const tx of transactions) {
    const row = map.get(tx.date);
    if (!row) continue;
    if (tx.type === 'credit') row.credit += tx.amount;
    if (tx.type === 'debit') row.debit += tx.amount;
  }
  return [...map.values()];
}

function confidenceScore(input: { count: number; coverageDays: number; activeDays: number; volatility: number; recurringCount: number }) {
  const countScore = Math.min(30, input.count * 2.2);
  const coverageScore = Math.min(28, input.coverageDays * 0.55);
  const activeScore = Math.min(22, input.activeDays * 2.8);
  const recurringScore = Math.min(8, input.recurringCount * 2);
  const volatilityPenalty = Math.min(18, input.volatility / 120);
  return Math.max(20, Math.min(94, Math.round(18 + countScore + coverageScore + activeScore + recurringScore - volatilityPenalty)));
}

function healthScore(input: { monthIncome: number; monthSpend: number; balance: number; dailySpend: number; anomalies: number }) {
  const cashflowBase = input.monthIncome > 0 ? ((input.monthIncome - input.monthSpend) / input.monthIncome) * 30 : input.monthSpend > 0 ? -18 : 0;
  const buffer = input.dailySpend > 0 ? Math.min(28, (input.balance / input.dailySpend) * 0.8) : 12;
  const anomalyPenalty = input.anomalies * 4;
  return Math.max(8, Math.min(96, Math.round(52 + cashflowBase + buffer - anomalyPenalty)));
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const avg = average(values);
  return Math.sqrt(average(values.map((value) => (value - avg) ** 2)));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function startDay(value: string | Date) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: string | Date, b: string | Date) {
  return Math.round((startDay(b).getTime() - startDay(a).getTime()) / 86400000);
}

export function cleanText(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function asRecord(row: unknown): DbRow | null {
  return row && typeof row === 'object' ? row as DbRow : null;
}

function readString(row: DbRow, key: string) {
  const value = row[key];
  return typeof value === 'string' ? cleanText(value) : value === null || value === undefined ? '' : cleanText(String(value));
}

function readOptionalString(row: DbRow, key: string) {
  const value = readString(row, key);
  return value || null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  return moneyNumber(value);
}

function isLifestyle(value: string): value is Lifestyle {
  return ['student', 'freelancer', 'salaried', 'business_owner', 'custom'].includes(value);
}

function isCashflowCadence(value: string): value is CashflowCadence {
  return ['allowance', 'scholarship', 'part_time', 'none', 'unknown', 'irregular', 'project', 'monthly', 'biweekly', 'fixed', 'business', 'weekly'].includes(value);
}

function isTransactionType(value: string): value is TransactionType {
  return ['debit', 'credit', 'transfer'].includes(value);
}
