import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Account, Goal, Profile, Transaction } from '../domain/finance';
import { buildFinanceModel } from '../domain/finance';
import { supabase } from '../lib/supabase';
import type { CoachMessage, ImportLog } from '../lib/repository';
import { deleteGoal, deleteTransaction, loadWorkspace, saveGoal, saveImportLog, saveTransaction, updateAccount as persistAccount, updateGoalCurrent } from '../lib/repository';
import { parseTransactionCsv, parseUpiBulkText, parseUpiText } from '../domain/upi';

export function useFinanceData(userId?: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [imports, setImports] = useState<ImportLog[]>([]);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const workspace = await loadWorkspace(userId);
      if (!mounted.current) return;
      setProfile(workspace.profile);
      setAccount(workspace.account);
      setTransactions(workspace.transactions);
      setGoals(workspace.goals);
      setImports(workspace.imports);
      setCoachMessages(workspace.coachMessages);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load workspace.');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    if (!userId) {
      setLoading(false);
      return;
    }
    refresh();
    return () => {
      mounted.current = false;
    };
  }, [refresh, userId]);

  useEffect(() => {
    if (!userId || !supabase) return;
    const channel = supabase
      .channel(`workspace:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coach_messages', filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const model = useMemo(() => buildFinanceModel({ account, transactions, goals }), [account, transactions, goals]);

  async function runMutation<T>(operation: () => Promise<T>) {
    if (!userId) throw new Error('You must be signed in.');
    setError(null);
    try {
      const result = await operation();
      await refresh();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed.';
      setError(message);
      throw err;
    }
  }

  return {
    profile,
    account,
    transactions,
    goals,
    imports,
    coachMessages,
    loading,
    error,
    model,
    refresh,
    async addTransaction(input: Partial<Transaction>) {
      return runMutation(() => saveTransaction(userId!, input));
    },
    async removeTransaction(id: string) {
      return runMutation(() => deleteTransaction(userId!, id));
    },
    async importUpiText(text: string) {
      const parsed = parseUpiText(text);
      if (!parsed.ok || !parsed.transaction) throw new Error(parsed.error || 'Could not parse UPI/GPay text.');
      const tx = await runMutation(() => saveTransaction(userId!, parsed.transaction!));
      await saveImportLog(userId!, { source: 'gpay_upi_import', accepted: 1, rejected: 0, facts: parsed.facts || [] });
      await refresh();
      return tx;
    },
    async importCsv(text: string) {
      const parsed = parseTransactionCsv(text);
      let accepted = 0;
      for (const tx of parsed.accepted) {
        try {
          await saveTransaction(userId!, tx);
          accepted += 1;
        } catch {
          // Duplicate rows are counted as rejected and reported in the import log.
        }
      }
      const rejected = parsed.rejected.length + (parsed.accepted.length - accepted);
      await saveImportLog(userId!, { source: 'csv_import', accepted, rejected, facts: parsed.rejected.slice(0, 4).map((row) => `Row ${row.row}: ${row.error}`) });
      await refresh();
      return { accepted, rejected };
    },
    async importUpiBulk(text: string) {
      const parsed = parseUpiBulkText(text);
      let accepted = 0;
      for (const tx of parsed.accepted) {
        try {
          await saveTransaction(userId!, tx);
          accepted += 1;
        } catch {
          // Existing references are rejected by the unique index and counted below.
        }
      }
      const rejected = parsed.rejected.length + (parsed.accepted.length - accepted);
      await saveImportLog(userId!, { source: 'gpay_upi_bulk_import', accepted, rejected, facts: parsed.rejected.slice(0, 4).map((row) => `Entry ${row.row}: ${row.error}`) });
      await refresh();
      return { accepted, rejected };
    },
    async addGoal(input: Partial<Goal>) {
      return runMutation(() => saveGoal(userId!, input));
    },
    async updateGoal(id: string, currentAmount: number) {
      return runMutation(() => updateGoalCurrent(userId!, id, currentAmount));
    },
    async removeGoal(id: string) {
      return runMutation(() => deleteGoal(userId!, id));
    },
    async updateAccount(input: Partial<Account>) {
      return runMutation(() => persistAccount(userId!, input));
    },
  };
}
