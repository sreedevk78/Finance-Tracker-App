import { useState } from 'react';
import { ArrowUp, Brain, Database, ShieldCheck } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { coachResponse } from '../domain/finance';
import { saveCoachExchange } from '../lib/repository';
import { useAuth } from '../contexts/AuthContext';
import type { Workspace } from '../lib/ui';

export default function Coach({ workspace }: { workspace: Workspace }) {
  const { user, session } = useAuth();
  const { account, transactions, goals, model, coachMessages, refresh } = workspace;
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function ask(question = input) {
    if (!question.trim() || !user) return;
    setLoading(true);
    setError('');
    setInput('');
    try {
      const res = await fetchWithTimeout('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ message: question }),
      }, 15000);
      if (!res.ok) throw new Error((await res.json()).error || 'Coach request failed.');
      const data = await res.json();
      await saveCoachExchange(user.id, question, data.text, data.confidence, data.facts || []);
      await refresh();
    } catch (err) {
      const deterministic = coachResponse(question, account, model, transactions, goals);
      await saveCoachExchange(user.id, question, deterministic.text, deterministic.confidence, deterministic.facts);
      await refresh();
      setError(err instanceof Error ? `Remote model unavailable; Aura saved an offline verified calculation instead. ${err.message}` : 'Remote model unavailable; Aura saved an offline verified calculation instead.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <TopBar title="Coach" subtitle="Grounded financial memory" />
      <main className="grid gap-4 px-container-margin pb-10 lg:grid-cols-[1.1fr_.9fr]">
        <section className="min-w-0 rounded-[2rem] border border-surface-container bg-surface p-5 card-shadow">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Brain /></div>
            <div><p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Aura Coach</p><h2 className="text-title-md font-black">Ask from verified context</h2></div>
          </div>
          <div className="grid min-h-[420px] content-start gap-3">
            {coachMessages.map((message) => (
              <article key={message.id || `${message.created_at}-${message.content}`} className={`max-w-[86%] min-w-0 rounded-3xl p-4 ${message.role === 'user' ? 'ml-auto bg-on-surface text-surface' : 'bg-surface-container-low'}`}>
                <p className="text-[11px] font-black uppercase tracking-widest opacity-60">{message.role === 'user' ? 'You' : 'Aura'}</p>
                <p className="mt-2 break-words leading-relaxed">{message.content}</p>
                {message.confidence !== null && message.confidence !== undefined && <p className="mt-2 text-body-sm opacity-70">{message.confidence}% grounded confidence</p>}
                {Array.isArray(message.facts) && message.facts.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">{message.facts.map((fact: string) => <span key={fact} className="max-w-full break-words rounded-full bg-white/70 px-2 py-1 text-[11px] font-bold text-on-surface-variant">{fact}</span>)}</div>
                )}
              </article>
            ))}
            {!coachMessages.length && (
              <div className="rounded-3xl bg-surface-container-low p-6">
                <p className="font-black">Grounding status</p>
                <p className="mt-2 text-on-surface-variant">{model.ready ? `Forecast context is available with ${model.confidence}% confidence.` : model.reasons[0]}</p>
              </div>
            )}
          </div>
          {error && <p className="mt-4 rounded-2xl bg-error-container p-3 text-body-sm font-bold text-error">{error}</p>}
          <div className="mt-5 flex gap-2">
            <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && ask()} placeholder="Ask about forecasts, recurring charges, goals, or UPI/GPay imports" className="h-14 min-w-0 flex-1 rounded-2xl bg-surface-container-low px-4 outline-none" />
            <button disabled={loading} onClick={() => ask()} className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-on-primary disabled:opacity-50"><ArrowUp /></button>
          </div>
        </section>

        <aside className="grid min-w-0 content-start gap-4">
          <div className="rounded-[2rem] border border-surface-container bg-surface p-6 card-shadow">
            <div className="flex items-center gap-3"><Database className="h-6 w-6 text-primary" /><h2 className="text-title-md font-black">Context inventory</h2></div>
            <div className="mt-5 grid gap-3">
              <Fact label="Transactions" value={String(transactions.length)} />
              <Fact label="Goals" value={String(goals.length)} />
              <Fact label="Recurring patterns" value={String(model.recurring.length)} />
              <Fact label="Forecast" value={model.ready ? `${model.confidence}%` : 'Blocked'} />
            </div>
          </div>
          <div className="rounded-[2rem] bg-primary/10 p-5 text-primary">
            <div className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0" /><p className="text-body-sm font-bold leading-relaxed">Coach responses must cite stored transactions, goals, forecasts, or import status. Unsupported claims are refused.</p></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Predict my balance', 'Explain my burn rate', 'What did GPay import?', 'What recurring charges exist?'].map((chip) => (
              <button key={chip} onClick={() => ask(chip)} className="rounded-full bg-surface px-4 py-2 text-body-sm font-bold card-shadow">{chip}</button>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-2xl bg-surface-container-low p-4"><span className="font-bold text-on-surface-variant">{label}</span><strong>{value}</strong></div>;
}

function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ms);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => window.clearTimeout(timer));
}
