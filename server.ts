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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

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
      aiConfigured: Boolean(OPENAI_API_KEY || GEMINI_API_KEY),
      aiProvider: OPENAI_API_KEY ? 'openai' : GEMINI_API_KEY ? 'gemini' : null,
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
      if (!OPENAI_API_KEY && !GEMINI_API_KEY) return res.status(503).json({ error: 'No live AI provider is configured. Add OPENAI_API_KEY or GEMINI_API_KEY on the server.' });

      const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${bearer}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: userResult, error: userError } = await db.auth.getUser(bearer);
      if (userError || !userResult.user) return res.status(401).json({ error: 'Invalid session.' });
      const userId = userResult.user.id;
      if (!consumeRateLimit(userId)) return res.status(429).json({ error: 'Coach rate limit reached. Try again in a minute.' });

      const [profile, account, transactions, goals, memories] = await Promise.all([
        db.from('profiles').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
        db.from('accounts').select('*').eq('user_id', userId).order('updated_at', { ascending: false }).limit(1),
        db.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(250),
        db.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        db.from('coach_messages').select('role, content, confidence, facts, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(12),
      ]);
      for (const response of [profile, account, transactions, goals, memories]) {
        if (response.error) throw response.error;
      }

      const normalizedAccount = normalizeAccountRow(account.data?.[0]);
      const normalizedTransactions = (transactions.data || []).map(normalizeTransactionRow).filter(isPresent);
      const normalizedGoals = (goals.data || []).map(normalizeGoalRow).filter(isPresent);
      const question = typeof req.body?.message === 'string' ? req.body.message : '';
      if (!question.trim()) return res.status(400).json({ error: 'Question is required.' });
      if (question.length > 2000) return res.status(400).json({ error: 'Question is too long.' });
      const model = buildFinanceModel({
        account: normalizedAccount,
        transactions: normalizedTransactions,
        goals: normalizedGoals,
      });
      const deterministic = coachResponse(question, normalizedAccount, model, normalizedTransactions, normalizedGoals);

      const prompt = [
        'You are Aura, a financial intelligence coach.',
        'You must only answer from the provided JSON facts.',
        'If the facts are insufficient, say exactly what data is missing.',
        'Never fabricate balances, subscriptions, trends, savings claims, or predictions.',
        'Never give investment, tax, or legal advice. Explain observable cashflow and data quality.',
        'Return a concise answer. Mention confidence only when it is grounded in the provided model.',
        JSON.stringify({
          question,
          profile: profile.data,
          account: normalizedAccount,
          forecast: model,
          deterministicAnswer: deterministic,
          recentMemory: memories.data || [],
          transactions: normalizedTransactions.slice(0, 80),
          goals: normalizedGoals,
        }),
      ].join('\n');
      const providerResult = OPENAI_API_KEY
        ? await callOpenAI(prompt)
        : await callGemini(prompt);
      if (!providerResult.text) return res.status(502).json({ error: 'AI provider returned an empty response.' });
      res.json({ text: providerResult.text, confidence: deterministic.confidence, facts: deterministic.facts, grounded: true, mode: providerResult.mode });
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

async function callOpenAI(prompt: string) {
  const response = await withTimeout(fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.1',
      instructions: 'Answer as Aura inside a fintech app. Use only provided facts. Refuse unsupported claims.',
      input: prompt,
      max_output_tokens: 650,
    }),
  }), 16000);
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(readApiError(body, 'OpenAI request failed.'));
  return { text: extractOpenAIText(body), mode: 'openai_grounded' };
}

async function callGemini(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const response = await withTimeout(ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  }), 16000);
  return { text: response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '', mode: 'gemini_grounded' };
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

function consumeRateLimit(userId: string) {
  const now = Date.now();
  const bucket = requestBuckets.get(userId);
  if (!bucket || bucket.resetAt < now) {
    requestBuckets.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= 20) return false;
  bucket.count += 1;
  return true;
}

function readApiError(body: Record<string, unknown>, fallback: string) {
  const error = body.error;
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message?: unknown }).message || fallback);
  return fallback;
}

function extractOpenAIText(body: Record<string, unknown>) {
  if (typeof body.output_text === 'string') return body.output_text.trim();
  const output = Array.isArray(body.output) ? body.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string') parts.push(text);
    }
  }
  return parts.join('\n').trim();
}

startServer().catch((error) => {
  console.error('Startup error:', error);
  process.exit(1);
});
