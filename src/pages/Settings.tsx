import { useEffect, useState } from 'react';
import { Database, Download, KeyRound, Link2, LogOut, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { CURRENCIES, currencyInfo, formatMoney } from '../domain/finance';
import { useAuth } from '../contexts/AuthContext';
import type { Workspace } from '../lib/ui';

export default function Settings({ workspace }: { workspace: Workspace }) {
  const { signOut } = useAuth();
  const { profile, account, transactions, goals, imports, model, updateAccount } = workspace;
  const [currency, setCurrency] = useState(account?.currency || 'INR');
  const [balance, setBalance] = useState(String(account?.balance || 0));
  const [balanceKnown, setBalanceKnown] = useState(Boolean(account?.balance_known));
  const [provider, setProvider] = useState<{ aiConfigured: boolean; aiProvider: string | null } | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const info = currencyInfo(currency);

  useEffect(() => {
    let alive = true;
    fetch('/api/health')
      .then((response) => response.json())
      .then((data) => {
        if (alive) setProvider({ aiConfigured: Boolean(data.aiConfigured), aiProvider: data.aiProvider || null });
      })
      .catch(() => {
        if (alive) setProvider({ aiConfigured: false, aiProvider: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  async function saveAccount() {
    setSaving(true);
    setStatus('');
    try {
      await updateAccount({ currency: info.code, currency_symbol: info.symbol, balance: Number(balance || 0), balance_known: balanceKnown });
      setStatus('Account anchor saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save account.');
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const header = 'date,type,merchant,category,amount,source,external_ref,vpa,note';
    const rows = transactions.map((tx) => [tx.date, tx.type, tx.merchant_name, tx.category_id, tx.amount, tx.source, tx.external_ref || '', tx.vpa || '', tx.note || ''].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
    const url = URL.createObjectURL(new Blob([[header, ...rows].join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aura-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <TopBar title="Settings" subtitle="Security and data" />
      <main className="grid gap-4 px-container-margin pb-10 lg:grid-cols-[.9fr_1.1fr]">
        <section className="rounded-[2rem] bg-on-surface p-7 text-surface shadow-2xl">
          <p className="text-label-caps font-black uppercase tracking-widest text-surface/55">Workspace</p>
          <h1 className="mt-3 text-display-lg-mobile font-black">{profile?.full_name || 'Aura workspace'}</h1>
          <p className="mt-3 text-surface/70">{profile?.email}</p>
          <div className="mt-8 grid gap-3">
            <Metric icon={ShieldCheck} label="Forecast status" value={model.ready ? `${model.confidence}% confidence` : 'Data gated'} />
            <Metric icon={Database} label="Transactions" value={String(transactions.length)} />
            <Metric icon={Link2} label="UPI/GPay imports" value={String(transactions.filter((tx) => tx.source.includes('upi') || tx.source.includes('gpay')).length)} />
          </div>
          <button onClick={signOut} className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-surface font-black text-on-surface"><LogOut className="h-5 w-5" /> Sign out</button>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <div className="mb-5 flex items-center gap-3"><Wallet className="h-6 w-6 text-primary" /><h2 className="text-title-md font-black">Balance anchor</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-14 rounded-2xl bg-surface-container-low px-4 outline-none">
                {Object.values(CURRENCIES).map((item) => <option key={item.code} value={item.code}>{item.code} ({item.symbol})</option>)}
              </select>
              <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" className="h-14 rounded-2xl bg-surface-container-low px-4 outline-none" />
              <label className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-body-sm font-bold sm:col-span-2">
                <input type="checkbox" checked={balanceKnown} onChange={(e) => setBalanceKnown(e.target.checked)} /> This balance is verified.
              </label>
              <button disabled={saving} onClick={saveAccount} className="h-14 rounded-2xl bg-primary font-black text-on-primary disabled:opacity-50 sm:col-span-2">{saving ? 'Saving...' : 'Save account'}</button>
            </div>
            <p className="mt-4 text-body-sm text-on-surface-variant">Current anchor: {formatMoney(account?.balance || 0, account || undefined)}</p>
            {status && <p className="mt-3 rounded-2xl bg-primary/10 p-3 text-body-sm font-bold text-primary">{status}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Action icon={Download} title="Export data" copy="Download the transaction ledger as CSV." action={exportCsv} />
            <Action icon={KeyRound} title="Provider status" copy={`${imports.length} import logs. AI ${provider?.aiConfigured ? `connected to ${provider.aiProvider}` : 'not configured'}. Supabase RLS enabled.`} />
          </div>

          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Production constraints</p>
            <div className="mt-4 grid gap-3">
              <Constraint ok label="Supabase auth/data" detail="Configured through environment keys and RLS schema." />
              <Constraint ok={Boolean(provider?.aiConfigured)} label="Live AI coach" detail={provider?.aiConfigured ? `Server-side ${provider.aiProvider} provider is connected.` : 'Set OPENAI_API_KEY or GEMINI_API_KEY. Chat is locked until then.'} />
              <Constraint ok label="GPay/UPI import" detail="Receipt/SMS/CSV linking with UTR/RRN dedupe." />
              <Constraint label="Direct Google Pay history sync" detail="Not exposed as a public consumer API; use AA/PSP provider for live sync." />
              <Constraint label="Native biometrics" detail="Requires Capacitor/React Native shell; not available in this web repo." />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-3xl bg-white/10 p-4"><Icon className="mb-3 h-5 w-5" /><p className="text-[11px] font-black uppercase tracking-widest text-white/55">{label}</p><p className="mt-1 font-black">{value}</p></div>;
}

function Action({ icon: Icon, title, copy, action }: { icon: LucideIcon; title: string; copy: string; action?: () => void }) {
  const content = <><Icon className="mb-5 h-6 w-6 text-primary" /><h3 className="font-black">{title}</h3><p className="mt-2 text-body-sm text-on-surface-variant">{copy}</p></>;
  if (action) return <button onClick={action} className="rounded-[2rem] border border-surface-container bg-surface p-6 text-left card-shadow">{content}</button>;
  return <article className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">{content}</article>;
}

function Constraint({ ok = false, label, detail }: { ok?: boolean; label: string; detail: string }) {
  return <div className="rounded-2xl bg-surface-container-low p-4"><p className={`font-black ${ok ? 'text-primary' : 'text-error'}`}>{label}</p><p className="mt-1 text-body-sm text-on-surface-variant">{detail}</p></div>;
}
