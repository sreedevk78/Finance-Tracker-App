import { AlertTriangle, ArrowRight, CheckCircle2, IndianRupee, LineChart, MessageCircle, Plus, ShieldCheck, Sparkles, Target, UploadCloud, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import { CATEGORIES, formatMoney, signedMoney } from '../domain/finance';
import type { Workspace } from '../lib/ui';

export default function Dashboard({ workspace }: { workspace: Workspace }) {
  const { account, transactions, goals, model } = workspace;
  const primary = model.insights[0];
  const linkedUpi = transactions.filter((tx) => tx.source.includes('upi') || tx.source.includes('gpay')).length;
  const nextActions = [
    !linkedUpi ? 'Import GPay/UPI receipts or bank SMS text so Aura can see real spend without manual typing.' : null,
    !account?.balance_known ? 'Add a verified balance anchor. Zero is allowed only when it is true.' : null,
    !model.ready ? model.reasons[0] : null,
    model.ready ? 'Review the forecast range before asking the coach for tradeoffs.' : null,
  ].filter(Boolean) as string[];

  return (
    <div>
      <TopBar title="Aura" subtitle="Command center" />
      <main className="px-container-margin pb-10">
        <section className="grid gap-4 lg:grid-cols-[1.12fr_.88fr]">
          <div className="overflow-hidden rounded-[2.25rem] bg-on-surface p-7 text-surface shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-label-caps font-black uppercase tracking-widest text-surface/55">
                  {model.ready ? '30-day projected balance' : 'Verified balance anchor'}
                </p>
                <h2 className="mt-3 break-words text-5xl font-black leading-[0.94] tracking-normal sm:text-6xl lg:text-7xl">
                  {formatMoney(model.projected, account || undefined)}
                </h2>
                <p className="mt-5 max-w-2xl text-body-lg leading-relaxed text-surface/70">
                  {model.ready
                    ? `Confidence ${model.confidence}% with range ${formatMoney(model.low, account || undefined)} to ${formatMoney(model.high, account || undefined)}.`
                    : model.reasons[0]}
                </p>
              </div>
              <Link to="/activity" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface text-on-surface">
                <Plus className="h-6 w-6" />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Metric label="Health" value={model.health ? `${model.health}/100` : 'Gated'} />
              <Metric label="Cashflow" value={signedMoney(model.monthNet, account || undefined)} />
              <Metric label="Runway" value={!model.ready ? 'Gated' : model.runwayDays === null ? 'Stable' : model.runwayDays ? `${model.runwayDays}d` : 'n/a'} />
            </div>
          </div>

          <Link to="/insights" className="block rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow transition hover:bg-primary/5">
            <div className="flex items-center justify-between">
              <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Primary signal</p>
              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${primary.severity === 'high' ? 'bg-error-container text-error' : 'bg-primary/10 text-primary'}`}>
                {primary.confidence}% confidence
              </span>
            </div>
            <h3 className="mt-4 text-title-md font-black">{primary.title}</h3>
            <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">{primary.body}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {primary.facts.map((fact) => <span key={fact} className="rounded-full bg-surface-container-low px-3 py-2 text-[11px] font-bold text-on-surface-variant">{fact}</span>)}
            </div>
          </Link>
        </section>

        <section className="mt-4 rounded-[2rem] border border-surface-container bg-surface p-5 card-shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Start here</p>
              <h2 className="mt-1 text-title-md font-black">Build intelligence from real money movement</h2>
            </div>
            <Link to="/activity#import-upi" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 font-black text-on-primary">
              Import money <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <ActionCard icon={UploadCloud} title="1. Capture" body="Paste, share, upload, or manually add real transactions." to="/activity#import-upi" />
            <ActionCard icon={ShieldCheck} title="2. Verify" body="Set balance and let RLS-backed history sync." to="/settings" />
            <ActionCard icon={LineChart} title="3. Forecast" body="Unlock projection only after data gates pass." to="/forecast" />
            <ActionCard icon={MessageCircle} title="4. Coach" body="Ask live AI only when a provider key is configured." to="/coach" />
          </div>
          <div className="mt-5 grid gap-2">
            {nextActions.slice(0, 3).map((action) => (
              <div key={action} className="flex gap-3 rounded-2xl bg-surface-container-low p-4 text-body-sm font-bold text-on-surface-variant">
                <Target className="h-5 w-5 shrink-0 text-primary" />
                <span>{action}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card icon={IndianRupee} label="This month spend" value={formatMoney(model.monthSpend, account || undefined)} sub="Observed debits only" to="/insights" />
          <Card icon={Sparkles} label="Recurring load" value={formatMoney(model.recurringLoad, account || undefined)} sub={`${model.recurring.length} detected pattern${model.recurring.length === 1 ? '' : 's'}`} to="/forecast" />
          <Card icon={ShieldCheck} label="UPI/GPay linked" value={String(linkedUpi)} sub="Reference-backed imports" to="/activity#import-upi" />
          <Card icon={CheckCircle2} label="Active goals" value={String(goals.length)} sub="Protected outcomes" to="/goals" />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Forecast gate</p>
            <div className="mt-5 grid gap-3">
              <Gate ok={Boolean(account?.balance_known)} label="Balance anchor" detail={account?.balance_known ? formatMoney(account.balance, account) : 'Missing'} />
              <Gate ok={transactions.length >= 5} label="Transactions" detail={`${transactions.length} / 5 minimum`} />
              <Gate ok={model.coverageDays >= 7} label="History" detail={`${model.coverageDays} / 7 calendar days`} />
              <Gate ok={model.activeDays >= 2} label="Active days" detail={`${model.activeDays} / 2 active days`} />
            </div>
          </div>

          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Recent ledger</p>
                <h3 className="mt-1 text-title-md font-black">Latest activity</h3>
              </div>
              <Link to="/activity" className="flex items-center gap-1 rounded-full bg-surface-container-low px-3 py-2 text-body-sm font-black">
                Manage <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 grid gap-3">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4">
                  <div>
                    <p className="font-black">{tx.merchant_name}</p>
                    <p className="text-body-sm text-on-surface-variant">{CATEGORIES[tx.category_id]?.label || 'Other'} · {tx.date}</p>
                  </div>
                  <span className={`font-black ${tx.type === 'credit' ? 'text-primary' : 'text-error'}`}>
                    {tx.type === 'credit' ? '+' : '-'}{formatMoney(tx.amount, account || undefined)}
                  </span>
                </div>
              ))}
              {!transactions.length && (
                <div className="rounded-2xl border border-dashed border-surface-container p-8 text-center text-on-surface-variant">
                  Add real transactions or import UPI/GPay receipts to unlock intelligence.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ActionCard({ icon: Icon, title, body, to }: { icon: LucideIcon; title: string; body: string; to: string }) {
  return (
    <Link to={to} className="min-w-0 rounded-3xl bg-surface-container-low p-4 transition hover:bg-primary/10">
      <Icon className="mb-4 h-5 w-5 text-primary" />
      <p className="font-black">{title}</p>
      <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">{body}</p>
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-4">
      <p className="text-[11px] font-black uppercase tracking-widest text-white/55">{label}</p>
      <p className="mt-2 text-title-md font-black">{value}</p>
    </div>
  );
}

function Card({ icon: Icon, label, value, sub, to }: { icon: LucideIcon; label: string; value: string; sub: string; to: string }) {
  return (
    <Link to={to} className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow transition hover:bg-primary/5">
      <Icon className="mb-5 h-6 w-6 text-primary" />
      <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">{label}</p>
      <h3 className="mt-2 text-display-lg-mobile font-black">{value}</h3>
      <p className="mt-2 text-body-sm text-on-surface-variant">{sub}</p>
    </Link>
  );
}

function Gate({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
      {ok ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <AlertTriangle className="h-5 w-5 text-error" />}
      <div>
        <p className="font-black">{label}</p>
        <p className="text-body-sm text-on-surface-variant">{detail}</p>
      </div>
    </div>
  );
}
