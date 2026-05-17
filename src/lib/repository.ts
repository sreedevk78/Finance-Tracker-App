import type { Account, Goal, Profile, Transaction } from '../domain/finance';
import { normalizeAccountRow, normalizeGoalRow, normalizeProfileRow, normalizeTransaction, normalizeTransactionRow } from '../domain/finance';
import { requireSupabase } from './supabase';

export interface ImportLog {
  id?: string;
  user_id?: string;
  source: string;
  accepted: number;
  rejected: number;
  facts: string[];
  created_at?: string;
}

export interface CoachMessage {
  id?: string;
  user_id?: string;
  role: 'user' | 'assistant';
  content: string;
  confidence: number | null;
  facts: string[];
  created_at?: string;
}

export async function loadWorkspace(userId: string) {
  const db = requireSupabase();
  const [profile, account, transactions, goals, imports, coachMessages] = await Promise.all([
    db.from('profiles').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
    db.from('accounts').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
    db.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).order('created_at', { ascending: false }),
    db.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    db.from('imports').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    db.from('coach_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(80),
  ]);
  for (const response of [profile, account, transactions, goals, imports, coachMessages]) {
    if (response.error) throw response.error;
  }
  return {
    profile: normalizeProfileRow(profile.data?.[0]),
    account: normalizeAccountRow(account.data?.[0]),
    transactions: (transactions.data || []).map(normalizeTransactionRow).filter(isPresent),
    goals: (goals.data || []).map(normalizeGoalRow).filter(isPresent),
    imports: (imports.data || []).map(normalizeImportLog),
    coachMessages: (coachMessages.data || []).map(normalizeCoachMessage).filter(isPresent),
  };
}

export async function upsertOnboarding(input: {
  userId: string;
  fullName: string | null;
  email: string | null;
  lifestyle: Profile['lifestyle'];
  cashflowCadence: Profile['cashflow_cadence'];
  currency: string;
  currencySymbol: string;
  balance: number;
  balanceKnown: boolean;
  expectedMonthlyInflow: number | null;
  firstGoalTitle: string;
  firstGoalTarget: number;
}) {
  const db = requireSupabase();
  const now = new Date().toISOString();
  const profilePayload = {
    user_id: input.userId,
    full_name: input.fullName || '',
    email: input.email || '',
    lifestyle: input.lifestyle,
    cashflow_cadence: input.cashflowCadence,
    expected_monthly_inflow: input.expectedMonthlyInflow,
    onboarding_completed_at: now,
    monthly_income: input.expectedMonthlyInflow || 0,
    currency: input.currency,
    currency_symbol: input.currencySymbol,
    financial_persona: 'mixed',
    primary_goal: input.firstGoalTitle,
  };
  const accountPayload = {
    user_id: input.userId,
    account_name: 'Primary account',
    account_type: 'checking',
    institution_name: 'Aura',
    current_balance: input.balance,
    currency: input.currency,
    currency_symbol: input.currencySymbol,
    balance: input.balance,
    balance_known: input.balanceKnown,
    balance_updated_at: input.balanceKnown ? now : null,
  };
  const [existingProfile, existingAccount] = await Promise.all([
    db.from('profiles').select('id').eq('user_id', input.userId).order('updated_at', { ascending: false }).limit(1),
    db.from('accounts').select('id').eq('user_id', input.userId).order('updated_at', { ascending: false }).limit(1),
  ]);
  if (existingProfile.error) throw existingProfile.error;
  if (existingAccount.error) throw existingAccount.error;
  const [profile, account] = await Promise.all([
    existingProfile.data?.[0]?.id
      ? db.from('profiles').update(profilePayload).eq('id', existingProfile.data[0].id).select('*').single()
      : db.from('profiles').insert(profilePayload).select('*').single(),
    existingAccount.data?.[0]?.id
      ? db.from('accounts').update(accountPayload).eq('id', existingAccount.data[0].id).select('*').single()
      : db.from('accounts').insert(accountPayload).select('*').single(),
  ]);
  if (profile.error) throw profile.error;
  if (account.error) throw account.error;
  if (input.firstGoalTitle) {
    const goal = await db.from('goals').insert({
      user_id: input.userId,
      title: input.firstGoalTitle,
      target_amount: input.firstGoalTarget,
      current_amount: 0,
      status: 'active',
    }).select('*').single();
    if (goal.error && goal.error.code !== '23505') throw goal.error;
  }
  return { profile: normalizeProfileRow(profile.data)!, account: normalizeAccountRow(account.data)! };
}

export async function saveTransaction(userId: string, input: Partial<Transaction>) {
  const db = requireSupabase();
  const tx = normalizeTransaction(input);
  if (!tx) throw new Error('A valid amount, merchant, and date are required.');
  const payload = {
    ...tx,
    user_id: userId,
    transaction_type: tx.type,
    transaction_date: tx.date,
    description: tx.note || null,
  };
  const result = await db.from('transactions').insert(payload).select('*').single();
  if (result.error) {
    if (result.error.code === '23505') throw new Error('This UPI/reference transaction is already linked.');
    throw result.error;
  }
  const saved = normalizeTransactionRow(result.data);
  if (!saved) throw new Error('Saved transaction could not be normalized.');
  return saved;
}

export async function deleteTransaction(userId: string, id: string) {
  const db = requireSupabase();
  const result = await db.from('transactions').delete().eq('user_id', userId).eq('id', id);
  if (result.error) throw result.error;
}

export async function saveImportLog(userId: string, payload: { source: string; accepted: number; rejected: number; facts: string[] }) {
  const db = requireSupabase();
  const result = await db.from('imports').insert({ user_id: userId, ...payload });
  if (result.error) throw result.error;
}

export async function saveGoal(userId: string, input: Partial<Goal>) {
  const db = requireSupabase();
  const title = String(input.title || '').trim();
  const target = Number(input.target_amount || 0);
  if (!title || target <= 0) throw new Error('Goal title and target amount are required.');
  const result = await db.from('goals').insert({
    user_id: userId,
    title,
    target_amount: target,
    current_amount: Number(input.current_amount || 0),
    deadline: input.deadline || null,
    status: input.status || 'active',
  }).select('*').single();
  if (result.error) throw result.error;
  const saved = normalizeGoalRow(result.data);
  if (!saved) throw new Error('Saved goal could not be normalized.');
  return saved;
}

export async function updateGoalCurrent(userId: string, id: string, currentAmount: number) {
  const db = requireSupabase();
  const result = await db.from('goals').update({ current_amount: currentAmount }).eq('user_id', userId).eq('id', id).select('*').single();
  if (result.error) throw result.error;
  const saved = normalizeGoalRow(result.data);
  if (!saved) throw new Error('Updated goal could not be normalized.');
  return saved;
}

export async function deleteGoal(userId: string, id: string) {
  const db = requireSupabase();
  const result = await db.from('goals').delete().eq('user_id', userId).eq('id', id);
  if (result.error) throw result.error;
}

export async function updateAccount(userId: string, input: Partial<Account>) {
  const db = requireSupabase();
  const payload = {
    user_id: userId,
    account_name: 'Primary account',
    account_type: 'checking',
    institution_name: 'Aura',
    currency: input.currency,
    currency_symbol: input.currency_symbol,
    current_balance: Number(input.balance || 0),
    balance: Number(input.balance || 0),
    balance_known: Boolean(input.balance_known),
    balance_updated_at: new Date().toISOString(),
  };
  const existing = await db.from('accounts').select('id').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1);
  if (existing.error) throw existing.error;
  const result = existing.data?.[0]?.id
    ? await db.from('accounts').update(payload).eq('id', existing.data[0].id).select('*').single()
    : await db.from('accounts').insert(payload).select('*').single();
  if (result.error) throw result.error;
  const saved = normalizeAccountRow(result.data);
  if (!saved) throw new Error('Updated account could not be normalized.');
  return saved;
}

export async function saveCoachExchange(userId: string, userText: string, assistantText: string, confidence: number, facts: string[]) {
  const db = requireSupabase();
  const rows = [
    { user_id: userId, role: 'user', content: userText, confidence: null, facts: [] },
    { user_id: userId, role: 'assistant', content: assistantText, confidence, facts },
  ];
  const result = await db.from('coach_messages').insert(rows);
  if (result.error) throw result.error;
}

function normalizeImportLog(row: Record<string, unknown>): ImportLog {
  return {
    id: stringOrUndefined(row.id),
    user_id: stringOrUndefined(row.user_id),
    source: String(row.source || 'unknown'),
    accepted: Number(row.accepted || 0),
    rejected: Number(row.rejected || 0),
    facts: Array.isArray(row.facts) ? row.facts.map(String) : [],
    created_at: stringOrUndefined(row.created_at),
  };
}

function normalizeCoachMessage(row: Record<string, unknown>): CoachMessage | null {
  const role = row.role === 'assistant' ? 'assistant' : row.role === 'user' ? 'user' : null;
  if (!role || !row.content) return null;
  return {
    id: stringOrUndefined(row.id),
    user_id: stringOrUndefined(row.user_id),
    role,
    content: String(row.content),
    confidence: row.confidence === null || row.confidence === undefined ? null : Number(row.confidence),
    facts: Array.isArray(row.facts) ? row.facts.map(String) : [],
    created_at: stringOrUndefined(row.created_at),
  };
}

function stringOrUndefined(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
