import { useMemo, useState } from 'react';
import { AlertTriangle, Info, Repeat2, ShoppingBag, TrendingUp } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { formatMoney } from '../domain/finance';
import type { Workspace } from '../lib/ui';

export default function Forecast({ workspace }: { workspace: Workspace }) {
  const { account, model } = workspace;
  const [scenario, setScenario] = useState('');
  const impact = Number(scenario || 0);
  const afterPurchase = model.projected - impact;
  const points = useMemo(() => Array.from({ length: 7 }, (_, index) => {
    const day = index * 5;
    return model.ready ? model.projected - (30 - day) * (model.dailyIncome - model.dailySpend) : account?.balance || 0;
  }), [account?.balance, model.dailyIncome, model.dailySpend, model.projected, model.ready]);
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const spread = Math.max(1, max - min);
  const coords = points.map((point, index) => `${8 + index * 14},${86 - ((point - min) / spread) * 62}`).join(' ');

  return (
    <div>
      <TopBar title="Forecast" subtitle="Explainable projection" />
      <main className="grid gap-4 px-container-margin pb-10 lg:grid-cols-[1.15fr_.85fr]">
        <section className="space-y-4">
          <div className="rounded-[2.25rem] bg-on-surface p-7 text-surface shadow-2xl">
            <p className="text-label-caps font-black uppercase tracking-widest text-surface/55">{model.ready ? 'Projected 30-day balance' : 'Forecast blocked'}</p>
            <h2 className="mt-3 break-words text-5xl font-black leading-[0.94] tracking-normal sm:text-6xl lg:text-7xl">{formatMoney(model.projected, account || undefined)}</h2>
            <p className="mt-5 max-w-2xl text-body-lg leading-relaxed text-surface/70">
              {model.ready ? `Confidence ${model.confidence}% with interval ${formatMoney(model.low, account || undefined)} to ${formatMoney(model.high, account || undefined)}.` : model.reasons.join(' ')}
            </p>
            {model.ready ? (
              <div className="mt-8 rounded-3xl bg-white/10 p-5">
                <svg viewBox="0 0 100 100" className="h-64 w-full" preserveAspectRatio="none">
                  <line x1="8" y1="86" x2="94" y2="86" stroke="rgba(255,255,255,.24)" />
                  <line x1="8" y1="24" x2="8" y2="86" stroke="rgba(255,255,255,.24)" />
                  <polyline points={coords} fill="none" stroke="#8ee6d2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex justify-between text-label-caps font-black uppercase tracking-widest text-surface/60"><span>Now</span><span>30 days</span></div>
              </div>
            ) : (
              <div className="mt-8 rounded-3xl border border-dashed border-white/30 p-8 text-surface/70">
                Aura does not render a fake chart. Add enough real data to unlock projection.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Assumptions used</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {model.assumptions.map((item) => <span key={item} className="rounded-full bg-surface-container-low px-4 py-2 text-body-sm font-bold text-on-surface-variant">{item}</span>)}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <div><p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Scenario</p><h2 className="text-title-md font-black">Can I afford this?</h2></div>
            </div>
            <input value={scenario} onChange={(event) => setScenario(event.target.value)} inputMode="decimal" placeholder="Purchase amount" className="mt-5 h-14 w-full rounded-2xl bg-surface-container-low px-4 outline-none" />
            <div className="mt-4 rounded-3xl bg-surface-container-low p-5">
              <p className="text-body-sm text-on-surface-variant">After-purchase projected balance</p>
              <h3 className="mt-2 text-display-lg-mobile font-black">{formatMoney(afterPurchase, account || undefined)}</h3>
              <p className="mt-3 text-body-sm text-on-surface-variant">This subtracts the scenario from the {model.ready ? 'forecasted' : 'known'} balance and preserves all forecast gates.</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <div className="flex items-center gap-3"><Repeat2 className="h-6 w-6 text-primary" /><h2 className="text-title-md font-black">Recurring detection</h2></div>
            <div className="mt-5 grid gap-3">
              {model.recurring.map((item) => (
                <div key={item.merchant} className="rounded-3xl bg-surface-container-low p-4">
                  <p className="font-black">{item.merchant}</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{formatMoney(item.amount, account || undefined)} · {item.cadence} · {item.confidence}% confidence</p>
                </div>
              ))}
              {!model.recurring.length && <p className="rounded-3xl border border-dashed border-surface-container p-6 text-center text-on-surface-variant">No recurring charge has enough stable observations yet.</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <div className="flex items-center gap-3"><AlertTriangle className="h-6 w-6 text-error" /><h2 className="text-title-md font-black">Anomaly checks</h2></div>
            <div className="mt-5 grid gap-3">
              {model.anomalies.map((tx) => (
                <div key={`${tx.merchant_name}-${tx.date}-${tx.amount}`} className="rounded-3xl bg-error-container p-4">
                  <p className="font-black text-error">{tx.merchant_name}</p>
                  <p className="mt-1 text-body-sm text-error">{formatMoney(tx.amount, account || undefined)} above threshold {formatMoney(tx.threshold, account || undefined)}</p>
                </div>
              ))}
              {!model.anomalies.length && <p className="rounded-3xl bg-surface-container-low p-6 text-center text-on-surface-variant">No high-confidence anomaly in the current dataset.</p>}
            </div>
          </div>

          <div className="rounded-[2rem] bg-primary/10 p-5 text-primary">
            <div className="flex gap-3"><Info className="h-5 w-5 shrink-0" /><p className="text-body-sm font-bold leading-relaxed">Forecasts are deterministic and explainable; no generated chart appears until data-quality rules pass.</p></div>
          </div>
        </aside>
      </main>
    </div>
  );
}
