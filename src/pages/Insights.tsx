import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ShieldCheck, type LucideIcon } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { formatMoney } from '../domain/finance';
import type { Workspace } from '../lib/ui';

export default function Insights({ workspace }: { workspace: Workspace }) {
  const { account, model } = workspace;
  return (
    <div>
      <TopBar title="Insights" subtitle="Signals and evidence" />
      <main className="px-container-margin pb-10">
        <section className="grid gap-4 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-surface-container bg-surface p-7 text-center card-shadow">
            <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Financial health</p>
            <div className="relative mx-auto mt-8 grid h-52 w-52 place-items-center rounded-full bg-surface-container-low">
              <div className="text-center">
                <p className="text-[4.5rem] font-black leading-none">{model.health || 0}</p>
                <p className="text-label-caps font-black text-on-surface-variant">/100</p>
              </div>
            </div>
            <p className="mt-6 text-body-md text-on-surface-variant">{model.ready ? 'Calculated from verified cashflow, buffer, and anomaly signals.' : 'Calibrating until forecast gates pass.'}</p>
          </div>
          <div className="grid gap-4">
            {model.insights.map((insight) => (
              <article key={insight.title} className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-title-md font-black">{insight.title}</h2>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase text-primary">{insight.confidence}%</span>
                </div>
                <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">{insight.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {insight.facts.map((fact) => <span key={fact} className="rounded-full bg-surface-container-low px-3 py-2 text-body-sm font-bold text-on-surface-variant">{fact}</span>)}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <Mini icon={Activity} label="Monthly spend" value={formatMoney(model.monthSpend, account || undefined)} />
          <Mini icon={ShieldCheck} label="Recurring load" value={formatMoney(model.recurringLoad, account || undefined)} />
          <Link to="/forecast" className="rounded-[2rem] bg-on-surface p-6 text-surface shadow-2xl">
            <p className="text-label-caps font-black uppercase tracking-widest text-surface/60">Next</p>
            <div className="mt-8 flex items-center justify-between"><h3 className="text-title-md font-black">Open forecast</h3><ArrowRight /></div>
          </Link>
        </section>
      </main>
    </div>
  );
}

function Mini({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
      <Icon className="mb-5 h-6 w-6 text-primary" />
      <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">{label}</p>
      <h3 className="mt-3 text-display-lg-mobile font-black">{value}</h3>
    </article>
  );
}
