# Aura Financial Intelligence

Aura is a Supabase-backed financial intelligence app focused on real personal cashflow, Indian UPI/GPay capture, deterministic forecasting, goals, and grounded coaching.

The app intentionally refuses fake financial output:

- no seeded balances
- no fabricated forecasts
- no fake subscriptions
- no hallucinated coach claims
- no silent fallback advice
- no direct Google Pay history sync claims

## Core Product

- Supabase Auth with Google OAuth and email magic-link sign-in.
- Supabase Postgres source of truth with Row Level Security for user-owned profiles, accounts, transactions, goals, imports, coach messages, and AI memory.
- Adaptive onboarding for students, freelancers, salaried professionals, business owners, and custom financial lifestyles.
- Optional income and verified zero-balance support.
- Manual transaction entry for exact control.
- UPI/GPay import from receipt text, SMS/bank notification text, UTR/RRN, VPA, or statement narration.
- Bulk UPI/SMS paste to reduce daily manual entry friction.
- Bank/wallet CSV import and CSV export.
- PWA installability and Android share-target support so copied receipt/SMS text can open directly in Aura’s UPI import panel.
- Deterministic forecast engine with data-quality gates, confidence intervals, transaction-density checks, recurring detection, anomaly detection, category breakdowns, and confidence scoring.
- Live AI coach endpoint that answers from Supabase financial facts, deterministic model output, and recent coach memory. The chat is locked until `OPENAI_API_KEY` or `GEMINI_API_KEY` exists server-side; Aura does not save fake offline coach answers.

## Google Pay / UPI Reality

Google Pay India public APIs are merchant payment APIs, not a consumer transaction-history feed. Google’s Omnichannel API documentation says it can be used only after contact by the Google Business Team for partner sign-up. NPCI UPI status/data APIs are available through banks/PSPs, not arbitrary consumer apps.

Aura therefore implements the real non-scraping path available now:

1. Share/copy GPay receipt or UPI SMS text into Aura.
2. Aura parses amount, date, direction, counterparty, VPA, and UPI reference/UTR/RRN.
3. Aura rejects entries without enough grounding.
4. Aura deduplicates reference-linked imports.

For true automatic transaction sync in India, integrate an RBI Account Aggregator/FIU partner or PSP/bank provider with user consent.

## Setup

Create `.env.local`:

```bash
VITE_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-5.1"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.0-flash"
APP_URL="http://localhost:3000"
PORT="3000"
HOST="127.0.0.1"
```

Apply the database migration:

```bash
psql "$DIRECT_URL" -f supabase/migrations/20260517183000_initial_finance_platform.sql
```

Run locally:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run lint
npm test
npm run build
npm start
```

## Verification Checklist

- Supabase health endpoint reports configured.
- RLS is enabled on all app tables.
- Anonymous REST reads return no user data.
- Onboarding does not require salary.
- Forecast remains blocked until data gates pass.
- Manual transaction add/delete works.
- UPI/GPay single import accepts reference-backed receipts and rejects ungrounded text.
- Bulk UPI/SMS paste imports valid entries and reports rejected rows.
- CSV import/export works.
- Coach is disabled without a live AI key; with a key, answers cite stored facts or explain missing context.
- Mobile layout has no horizontal overflow.
