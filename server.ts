import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { buildFinanceModel, coachResponse, normalizeAccountRow, normalizeGoalRow, normalizeTransactionRow } from './src/domain/finance';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '128kb' }));
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
      gpayConsumerHistorySync: false,
      mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    });
  });

  app.post('/shared-upi', (req, res) => {
    const sharedText = [req.body?.title, req.body?.text, req.body?.url].filter(Boolean).join('\n').slice(0, 4000);
    const encoded = JSON.stringify(sharedText).replace(/</g, '\\u003c');
    res.type('html').send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Importing to Aura</title></head>
<body>
<script>
try {
  const text = ${encoded};
  const queue = JSON.parse(localStorage.getItem('aura.pendingUpiShares') || '[]');
  if (text.trim()) queue.unshift({ text, at: new Date().toISOString() });
  localStorage.setItem('aura.pendingUpiShares', JSON.stringify(queue.slice(0, 10)));
} catch (error) {}
location.replace('/activity?shared=1#import-upi');
</script>
<p>Opening Aura...</p>
</body>
</html>`);
  });

  app.post('/api/ai/chat', async (req, res) => {
    try {
      const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ error: 'Supabase is not configured.' });
      if (!bearer) return res.status(401).json({ error: 'Missing Supabase user token.' });

      const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: userResult, error: userError } = await db.auth.getUser(bearer);
      if (userError || !userResult.user) return res.status(401).json({ error: 'Invalid session.' });
      const userId = userResult.user.id;

      const [profile, account, transactions, goals] = await Promise.all([
        db.from('profiles').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
        db.from('accounts').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
        db.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(250),
        db.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      ]);
      for (const response of [profile, account, transactions, goals]) {
        if (response.error) throw response.error;
      }

      const normalizedAccount = normalizeAccountRow(account.data?.[0]);
      const normalizedTransactions = (transactions.data || []).map(normalizeTransactionRow).filter(isPresent);
      const normalizedGoals = (goals.data || []).map(normalizeGoalRow).filter(isPresent);
      const question = typeof req.body?.message === 'string' ? req.body.message : '';
      const model = buildFinanceModel({
        account: normalizedAccount,
        transactions: normalizedTransactions,
        goals: normalizedGoals,
      });
      const deterministic = coachResponse(question, normalizedAccount, model, normalizedTransactions, normalizedGoals);
      if (!process.env.GEMINI_API_KEY) {
        return res.json({ ...deterministic, grounded: true, mode: 'deterministic_finance_engine' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = [
        'You are Aura, a financial intelligence coach.',
        'You must only answer from the provided JSON facts.',
        'If the facts are insufficient, say exactly what data is missing.',
        'Never fabricate balances, subscriptions, trends, savings claims, or predictions.',
        'Return concise advice with confidence and facts.',
        JSON.stringify({
          question,
          profile: profile.data,
          account: normalizedAccount,
          forecast: model,
          deterministicAnswer: deterministic,
        }),
      ].join('\n');
      const aiResponse = await withTimeout(ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }), 12000);
      const text = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) return res.json({ ...deterministic, grounded: true, mode: 'deterministic_finance_engine' });
      res.json({ text, confidence: deterministic.confidence, facts: deterministic.facts, grounded: true, mode: 'gemini_grounded' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'AI coaching failed.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, HOST, () => {
    console.log(`Aura running on http://localhost:${PORT}`);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('AI request timed out.')), ms);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }, (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

startServer().catch((error) => {
  console.error('Startup error:', error);
  process.exit(1);
});
