import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap, Landmark, Laptop, UserRound, WalletCards } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CADENCES, CURRENCIES, LIFESTYLES, currencyInfo, moneyNumber, type CashflowCadence, type Lifestyle } from '../domain/finance';
import { upsertOnboarding } from '../lib/repository';

const personaIcons = {
  student: GraduationCap,
  freelancer: Laptop,
  salaried: UserRound,
  business_owner: Landmark,
  custom: WalletCards,
};

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    lifestyle: 'student' as Lifestyle,
    cashflowCadence: 'allowance' as CashflowCadence,
    currency: 'INR',
    balance: '',
    balanceKnown: false,
    expectedMonthlyInflow: '',
    firstGoalTitle: LIFESTYLES.student.defaultGoal,
    firstGoalTarget: '10000',
  });

  const currency = currencyInfo(data.currency);
  const steps = ['Lifestyle', 'Money shape', 'Protected outcome'];

  async function finish() {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await upsertOnboarding({
        userId: user.id,
        fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        email: user.email || null,
        lifestyle: data.lifestyle,
        cashflowCadence: data.cashflowCadence,
        currency: currency.code,
        currencySymbol: currency.symbol,
        balance: moneyNumber(data.balance),
        balanceKnown: data.balanceKnown || data.balance.trim() !== '',
        expectedMonthlyInflow: data.expectedMonthlyInflow.trim() ? moneyNumber(data.expectedMonthlyInflow) : null,
        firstGoalTitle: data.firstGoalTitle,
        firstGoalTarget: moneyNumber(data.firstGoalTarget) || 10000,
      });
      await onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save onboarding.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-container-margin py-xl">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex gap-2">
            {steps.map((label, index) => (
              <div key={label} className={`h-2 rounded-full transition-all ${index <= step ? 'w-12 bg-primary' : 'w-5 bg-surface-container'}`} />
            ))}
          </div>
          <span className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">{steps[step]}</span>
        </header>

        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="text-label-caps font-black uppercase tracking-widest text-primary">Adaptive setup</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.94] tracking-normal sm:text-6xl lg:text-7xl">
              {step === 0 && 'Start with your real money rhythm.'}
              {step === 1 && 'Income can be unknown or zero.'}
              {step === 2 && 'Choose what Aura should protect first.'}
            </h1>
            <p className="mt-5 max-w-md text-body-lg leading-relaxed text-on-surface-variant">
              Aura will progressively enrich your profile as data arrives. It will not force a salary template or invent missing financial context.
            </p>
          </div>

          <div className="rounded-[2rem] border border-surface-container bg-surface p-5 card-shadow">
            {step === 0 && (
              <div className="grid gap-3">
                {(Object.keys(LIFESTYLES) as Lifestyle[]).map((id) => {
                  const Icon = personaIcons[id];
                  return (
                    <button
                      key={id}
                      onClick={() => setData({ ...data, lifestyle: id, firstGoalTitle: LIFESTYLES[id].defaultGoal })}
                      className={`flex items-center gap-4 rounded-3xl border-2 p-5 text-left transition-all ${data.lifestyle === id ? 'border-primary bg-primary/5' : 'border-surface-container'}`}
                    >
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-container-low text-primary"><Icon className="h-6 w-6" /></div>
                      <div className="flex-1">
                        <p className="font-black">{LIFESTYLES[id].label}</p>
                        <p className="mt-1 text-body-sm text-on-surface-variant">{LIFESTYLES[id].summary}</p>
                      </div>
                      {data.lifestyle === id && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-5">
                <label className="space-y-2">
                  <span className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Currency</span>
                  <select value={data.currency} onChange={(event) => setData({ ...data, currency: event.target.value })} className="h-14 w-full rounded-2xl bg-surface-container-low px-4 outline-none">
                    {Object.values(CURRENCIES).map((item) => <option key={item.code} value={item.code}>{item.code} ({item.symbol}) - {item.label}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Income rhythm</span>
                  <select value={data.cashflowCadence} onChange={(event) => setData({ ...data, cashflowCadence: event.target.value as CashflowCadence })} className="h-14 w-full rounded-2xl bg-surface-container-low px-4 outline-none">
                    {Object.entries(CADENCES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Expected monthly inflow</span>
                  <input value={data.expectedMonthlyInflow} onChange={(event) => setData({ ...data, expectedMonthlyInflow: event.target.value })} inputMode="decimal" placeholder="Skip if unknown" className="h-14 w-full rounded-2xl bg-surface-container-low px-4 outline-none" />
                </label>
                <label className="space-y-2">
                  <span className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Current available balance</span>
                  <input value={data.balance} onChange={(event) => setData({ ...data, balance: event.target.value })} inputMode="decimal" placeholder="Optional. Use 0 only if verified." className="h-14 w-full rounded-2xl bg-surface-container-low px-4 outline-none" />
                </label>
                <label className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-body-sm font-bold">
                  <input type="checkbox" checked={data.balanceKnown} onChange={(event) => setData({ ...data, balanceKnown: event.target.checked })} />
                  This balance is verified.
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="grid gap-5">
                <label className="space-y-2">
                  <span className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">First protected outcome</span>
                  <input value={data.firstGoalTitle} onChange={(event) => setData({ ...data, firstGoalTitle: event.target.value })} className="h-14 w-full rounded-2xl bg-surface-container-low px-4 outline-none" />
                </label>
                <label className="space-y-2">
                  <span className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Target amount ({currency.symbol})</span>
                  <input value={data.firstGoalTarget} onChange={(event) => setData({ ...data, firstGoalTarget: event.target.value })} inputMode="decimal" className="h-14 w-full rounded-2xl bg-surface-container-low px-4 outline-none" />
                </label>
                <div className="rounded-3xl bg-primary/10 p-5 text-body-sm font-bold leading-relaxed text-primary">
                  Forecasts remain locked until you add at least 5 real transactions across at least 7 calendar days and 2 active transaction days.
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-6 rounded-2xl bg-error-container p-4 text-error font-bold">{error}</p>}

        <footer className="mt-8 flex items-center justify-between">
          <button disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="flex h-14 items-center gap-2 rounded-2xl bg-surface px-5 font-black disabled:opacity-30">
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          <button
            disabled={saving}
            onClick={() => step === steps.length - 1 ? finish() : setStep((value) => value + 1)}
            className="flex h-14 items-center gap-2 rounded-2xl bg-on-surface px-6 font-black text-surface disabled:opacity-50"
          >
            {step === steps.length - 1 ? saving ? 'Saving...' : 'Enter Aura' : 'Continue'} <ArrowRight className="h-5 w-5" />
          </button>
        </footer>
      </section>
    </main>
  );
}
