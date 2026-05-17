import { useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function submitEmail() {
    setStatus('');
    setError('');
    try {
      await signInWithEmail(email);
      setStatus('Magic link sent. Check your email to continue.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send magic link.');
    }
  }

  async function google() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background px-container-margin py-xl">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="min-w-0 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-label-caps font-black uppercase tracking-widest text-primary">
            <Sparkles className="h-4 w-4 fill-current" /> Aura intelligence
          </div>
          <div className="space-y-5">
            <h1 className="max-w-[17rem] text-4xl font-black leading-[0.96] tracking-normal sm:max-w-xl sm:text-6xl lg:max-w-3xl lg:text-8xl">
              Finance that refuses to guess.
            </h1>
            <p className="max-w-[17rem] text-body-lg leading-relaxed text-on-surface-variant sm:max-w-xl">
              Forecasts, recurring detection, GPay/UPI imports, and coaching are grounded in your verified data. No sample balances. No fake predictions.
            </p>
          </div>
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            {['RLS protected', 'UPI reference linking', 'Confidence-scored forecasts'].map((item) => (
              <div key={item} className="rounded-3xl bg-surface p-5 card-shadow">
                <LockKeyhole className="mb-4 h-5 w-5 text-primary" />
                <p className="text-body-sm font-black">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.2rem] border border-surface-container bg-surface p-6 card-shadow">
          <div className="mb-8">
            <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Secure access</p>
            <h2 className="mt-2 text-display-lg-mobile font-black tracking-normal">Continue to Aura</h2>
          </div>
          <button onClick={google} className="flex h-16 w-full items-center justify-between rounded-2xl bg-on-surface px-5 font-black text-surface">
            <span>Continue with Google</span>
            <ArrowRight className="h-5 w-5" />
          </button>
          <div className="my-6 flex items-center gap-3 text-label-caps font-black uppercase tracking-widest text-on-surface-variant">
            <span className="h-px flex-1 bg-surface-container" /> or <span className="h-px flex-1 bg-surface-container" />
          </div>
          <div className="space-y-3">
            <label className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Email magic link</label>
            <div className="flex gap-2 rounded-2xl bg-surface-container-low p-2">
              <Mail className="ml-3 mt-3 h-5 w-5 text-on-surface-variant" />
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none" placeholder="you@example.com" />
              <button onClick={submitEmail} className="rounded-xl bg-primary px-4 font-black text-on-primary">Send</button>
            </div>
          </div>
          {status && <p className="mt-4 rounded-2xl bg-primary/10 p-4 text-body-sm font-bold text-primary">{status}</p>}
          {error && <p className="mt-4 rounded-2xl bg-error-container p-4 text-body-sm font-bold text-error">{error}</p>}
        </div>
      </section>
    </main>
  );
}
