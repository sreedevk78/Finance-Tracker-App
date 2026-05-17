import { useState } from 'react';
import { Calendar, Plus, Target, Trash2 } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { formatMoney, todayISO } from '../domain/finance';
import type { Workspace } from '../lib/ui';

export default function Goals({ workspace }: { workspace: Workspace }) {
  const { account, goals, addGoal, updateGoal, removeGoal } = workspace;
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [deadline, setDeadline] = useState('');

  async function save() {
    await addGoal({ title, target_amount: Number(target), current_amount: Number(current || 0), deadline: deadline || null, status: 'active' });
    setTitle('');
    setTarget('');
    setCurrent('');
    setDeadline('');
  }

  return (
    <div>
      <TopBar title="Goals" subtitle="Protected outcomes" />
      <main className="grid gap-4 px-container-margin pb-10 lg:grid-cols-[.8fr_1.2fr]">
        <section className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Plus /></div>
            <div><p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">New target</p><h2 className="text-title-md font-black">Add goal</h2></div>
          </div>
          <div className="grid gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal name" className="h-14 rounded-2xl bg-surface-container-low px-4 outline-none" />
            <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" placeholder="Target amount" className="h-14 rounded-2xl bg-surface-container-low px-4 outline-none" />
            <input value={current} onChange={(e) => setCurrent(e.target.value)} inputMode="decimal" placeholder="Current saved" className="h-14 rounded-2xl bg-surface-container-low px-4 outline-none" />
            <input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" min={todayISO()} className="h-14 rounded-2xl bg-surface-container-low px-4 outline-none" />
            <button onClick={save} className="h-14 rounded-2xl bg-primary font-black text-on-primary">Save goal</button>
          </div>
        </section>
        <section className="grid gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_amount / Math.max(1, goal.target_amount)) * 100));
            return (
              <article key={goal.id} className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Target /></div>
                    <div>
                      <h2 className="text-title-md font-black">{goal.title}</h2>
                      <p className="mt-1 text-body-sm text-on-surface-variant">{goal.deadline ? <><Calendar className="mr-1 inline h-4 w-4" />{goal.deadline}</> : 'No deadline'}</p>
                    </div>
                  </div>
                  <button onClick={() => goal.id && removeGoal(goal.id)} className="text-error"><Trash2 className="h-5 w-5" /></button>
                </div>
                <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                  <div><p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Progress</p><h3 className="text-display-lg-mobile font-black">{pct}%</h3></div>
                  <p className="min-w-0 break-words text-right font-black">{formatMoney(goal.current_amount, account || undefined)} / {formatMoney(goal.target_amount, account || undefined)}</p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-container-low"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <input defaultValue={goal.current_amount} onBlur={(e) => goal.id && updateGoal(goal.id, Number(e.target.value))} inputMode="decimal" className="h-12 min-w-0 flex-1 rounded-2xl bg-surface-container-low px-4 outline-none" />
                  <span className="grid h-12 place-items-center rounded-2xl bg-surface-container-low px-4 text-body-sm font-bold text-on-surface-variant">Blur to save</span>
                </div>
              </article>
            );
          })}
          {!goals.length && <div className="rounded-[2rem] border border-dashed border-surface-container p-12 text-center text-on-surface-variant">No goals yet. Add a target so Aura can explain tradeoffs.</div>}
        </section>
      </main>
    </div>
  );
}
