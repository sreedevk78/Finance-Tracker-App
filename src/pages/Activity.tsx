import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Plus, Search, Trash2, UploadCloud, type LucideIcon } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { CATEGORIES, formatMoney, todayISO, type Transaction } from '../domain/finance';
import type { Workspace } from '../lib/ui';

export default function Activity({ workspace }: { workspace: Workspace }) {
  const { account, transactions, addTransaction, removeTransaction, importUpiText, importUpiBulk, importCsv } = workspace;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState('');
  const [captureMode, setCaptureMode] = useState<'upi' | 'bulk' | 'csv' | 'manual'>('upi');
  const [newTx, setNewTx] = useState<Partial<Transaction>>({ type: 'debit', amount: 0, merchant_name: '', category_id: 'food', date: todayISO(), source: 'manual' });
  const [upiText, setUpiText] = useState('');
  const [bulkUpiText, setBulkUpiText] = useState('');
  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('aura.pendingUpiShares');
    if (!raw) return;
    try {
      const queue = JSON.parse(raw) as Array<{ text: string; at: string }>;
      const next = queue[0];
      if (next?.text) {
        setUpiText(next.text);
        setStatus('Shared UPI/GPay text is ready to review and import.');
        setCaptureMode('upi');
        localStorage.setItem('aura.pendingUpiShares', JSON.stringify(queue.slice(1)));
      }
    } catch {
      localStorage.removeItem('aura.pendingUpiShares');
    }
  }, []);

  const filtered = useMemo(() => transactions.filter((tx) => {
    const matchesSearch = `${tx.merchant_name} ${tx.note || ''} ${tx.external_ref || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || tx.category_id === category;
    return matchesSearch && matchesCategory;
  }), [category, search, transactions]);

  async function saveManual() {
    await runAction('manual', async () => {
      await addTransaction(newTx);
      setNewTx({ type: 'debit', amount: 0, merchant_name: '', category_id: 'food', date: todayISO(), source: 'manual' });
      setStatus('Transaction saved.');
    });
  }

  async function saveUpi() {
    await runAction('upi', async () => {
      await importUpiText(upiText);
      setUpiText('');
      setStatus('UPI/GPay transaction linked by reference.');
    });
  }

  async function saveCsv() {
    await runAction('csv', async () => {
      const result = await importCsv(csvText);
      setCsvText('');
      setStatus(`${result.accepted} imported, ${result.rejected} rejected.`);
    });
  }

  async function saveBulkUpi() {
    await runAction('bulk', async () => {
      const result = await importUpiBulk(bulkUpiText);
      setBulkUpiText('');
      setStatus(`${result.accepted} UPI/GPay entries imported, ${result.rejected} rejected.`);
    });
  }

  async function loadFile(file: File | null, target: 'bulk' | 'csv') {
    if (!file) return;
    if (file.size > 1_000_000) {
      setStatus('File rejected. Import files must be under 1 MB.');
      return;
    }
    const text = await file.text();
    if (target === 'bulk') setBulkUpiText(text);
    else setCsvText(text);
    setStatus(`${file.name} loaded. Review before importing.`);
  }

  async function runAction(name: string, action: () => Promise<void>) {
    setBusy(name);
    setStatus('');
    try {
      await action();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy('');
    }
  }

  function exportCsv() {
    const header = 'date,type,merchant,category,amount,source,external_ref,vpa,note';
    const rows = transactions.map((tx) => [tx.date, tx.type, tx.merchant_name, tx.category_id, tx.amount, tx.source, tx.external_ref || '', tx.vpa || '', tx.note || ''].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','));
    const url = URL.createObjectURL(new Blob([[header, ...rows].join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aura-transactions-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <TopBar title="Money" subtitle="Ledger and imports" />
      <main className="grid gap-4 px-container-margin pb-10 xl:grid-cols-[.88fr_1.12fr]">
        <section className="grid gap-4">
          <section className="rounded-[2rem] border border-surface-container bg-surface p-5 card-shadow">
            <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Capture money movement</p>
            <h2 className="mt-1 text-title-md font-black">Pick the fastest real input path</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              <ModeButton active={captureMode === 'upi'} onClick={() => setCaptureMode('upi')} label="UPI receipt" />
              <ModeButton active={captureMode === 'bulk'} onClick={() => setCaptureMode('bulk')} label="Bulk paste" />
              <ModeButton active={captureMode === 'csv'} onClick={() => setCaptureMode('csv')} label="CSV file" />
              <ModeButton active={captureMode === 'manual'} onClick={() => setCaptureMode('manual')} label="Manual" />
            </div>
            <p className="mt-4 text-body-sm leading-relaxed text-on-surface-variant">
              Aura saves only reviewed transactions. GPay direct history sync is not available as a public consumer API, so the fastest real workflow is share, paste, upload, or import statement data.
            </p>
          </section>

          {captureMode === 'manual' && <Panel eyebrow="Manual verified entry" title="Add transaction" icon={Plus} id="manual">
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={newTx.type} onChange={(e) => setNewTx({ ...newTx, type: e.target.value as Transaction['type'] })} className="h-13 rounded-2xl bg-surface-container-low px-4 outline-none">
                <option value="debit">Debit</option><option value="credit">Credit</option><option value="transfer">Transfer</option>
              </select>
              <input value={String(newTx.amount || '')} onChange={(e) => setNewTx({ ...newTx, amount: Number(e.target.value) })} inputMode="decimal" placeholder="Amount" className="h-13 rounded-2xl bg-surface-container-low px-4 outline-none" />
              <input value={newTx.merchant_name || ''} onChange={(e) => setNewTx({ ...newTx, merchant_name: e.target.value })} placeholder="Merchant or counterparty" className="h-13 rounded-2xl bg-surface-container-low px-4 outline-none sm:col-span-2" />
              <select value={newTx.category_id} onChange={(e) => setNewTx({ ...newTx, category_id: e.target.value })} className="h-13 rounded-2xl bg-surface-container-low px-4 outline-none">
                {Object.entries(CATEGORIES).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
              </select>
              <input type="date" value={newTx.date || todayISO()} onChange={(e) => setNewTx({ ...newTx, date: e.target.value })} className="h-13 rounded-2xl bg-surface-container-low px-4 outline-none" />
              <textarea value={newTx.note || ''} onChange={(e) => setNewTx({ ...newTx, note: e.target.value })} placeholder="Optional receipt context" className="min-h-24 rounded-2xl bg-surface-container-low p-4 outline-none sm:col-span-2" />
              <button disabled={busy === 'manual'} onClick={saveManual} className="h-13 rounded-2xl bg-primary font-black text-on-primary disabled:opacity-50 sm:col-span-2">{busy === 'manual' ? 'Saving...' : 'Save transaction'}</button>
            </div>
          </Panel>}

          {captureMode === 'upi' && <Panel eyebrow="Indian GPay / UPI" title="Link transaction" icon={UploadCloud} id="import-upi">
            <p className="mb-4 text-body-sm leading-relaxed text-on-surface-variant">Paste a Google Pay receipt, UPI SMS, or bank narration. Aura requires amount, date, direction, and UPI reference/UTR/RRN.</p>
            <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-body-sm font-bold leading-relaxed text-primary">
              Install Aura as a PWA, then share copied GPay/UPI receipt text or bank notification text into Aura. It lands here for review before saving.
            </div>
            <textarea value={upiText} onChange={(e) => setUpiText(e.target.value)} placeholder="Paid ₹250 to Cafe Nova on 17/05/2026 UPI Ref No 612345678901" className="min-h-32 w-full rounded-2xl bg-surface-container-low p-4 outline-none" />
            <button disabled={busy === 'upi'} onClick={saveUpi} className="mt-3 h-13 w-full rounded-2xl bg-on-surface font-black text-surface disabled:opacity-50">{busy === 'upi' ? 'Linking...' : 'Link UPI/GPay transaction'}</button>
          </Panel>}

          {captureMode === 'bulk' && <Panel eyebrow="Low-friction capture" title="Bulk paste UPI/SMS history" icon={UploadCloud}>
            <p className="mb-4 text-body-sm leading-relaxed text-on-surface-variant">Paste multiple GPay receipts, UPI SMS messages, or bank notifications. Put each transaction on a new line when possible. Aura imports valid reference-backed entries and logs rejected rows.</p>
            <textarea value={bulkUpiText} onChange={(e) => setBulkUpiText(e.target.value)} placeholder={'Paid ₹250 to Cafe Nova on 17/05/2026 UPI Ref No 612345678901\nPaid ₹80 to Metro on 16/05/2026 UTR 612345678902\nReceived ₹2000 from Family on 15/05/2026 RRN 612345678903'} className="min-h-40 w-full rounded-2xl bg-surface-container-low p-4 outline-none" />
            <input type="file" accept=".txt,.csv,text/plain,text/csv" onChange={(event) => loadFile(event.target.files?.[0] || null, 'bulk')} className="mt-3 block w-full rounded-2xl bg-surface-container-low p-3 text-body-sm font-bold" />
            <button disabled={busy === 'bulk'} onClick={saveBulkUpi} className="mt-3 h-13 w-full rounded-2xl bg-primary font-black text-on-primary disabled:opacity-50">{busy === 'bulk' ? 'Importing...' : 'Parse and import bulk text'}</button>
          </Panel>}

          {captureMode === 'csv' && <Panel eyebrow="Bank / wallet CSV" title="Statement import" icon={FileText}>
            <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder={'date,description,debit,credit,utr\n17/05/2026,GPay to Cafe Nova,250,,612345678901'} className="min-h-32 w-full rounded-2xl bg-surface-container-low p-4 outline-none" />
            <input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => loadFile(event.target.files?.[0] || null, 'csv')} className="mt-3 block w-full rounded-2xl bg-surface-container-low p-3 text-body-sm font-bold" />
            <button disabled={busy === 'csv'} onClick={saveCsv} className="mt-3 h-13 w-full rounded-2xl bg-on-surface font-black text-surface disabled:opacity-50">{busy === 'csv' ? 'Importing...' : 'Import CSV'}</button>
          </Panel>}
        </section>

        <section className="rounded-[2rem] border border-surface-container bg-surface p-5 card-shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">Ledger</p>
              <h2 className="text-display-lg-mobile font-black">{filtered.length} transaction{filtered.length === 1 ? '' : 's'}</h2>
            </div>
            <button onClick={exportCsv} className="flex h-11 items-center gap-2 rounded-2xl bg-surface-container-low px-4 font-black"><Download className="h-4 w-4" /> Export</button>
          </div>
          {status && <p className="mt-4 rounded-2xl bg-primary/10 p-3 text-body-sm font-bold text-primary">{status}</p>}
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-2 rounded-2xl bg-surface-container-low px-4">
              <Search className="h-5 w-5 text-on-surface-variant" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search merchant, note, or reference" className="h-12 min-w-0 flex-1 bg-transparent outline-none" />
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-12 rounded-2xl bg-surface-container-low px-4 outline-none">
              <option value="all">All categories</option>
              {Object.entries(CATEGORIES).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
            </select>
          </div>
          <div className="mt-5 grid gap-3">
            {filtered.map((tx) => (
              <article key={tx.id} className="flex items-start justify-between gap-4 rounded-3xl bg-surface-container-low p-4">
                <div>
                  <p className="font-black">{tx.merchant_name}</p>
                  <p className="mt-1 text-body-sm text-on-surface-variant">{CATEGORIES[tx.category_id]?.label || 'Other'} · {tx.date} · {tx.source}{tx.external_ref ? ` · ref ${tx.external_ref}` : ''}</p>
                  {tx.note && <p className="mt-2 line-clamp-2 text-body-sm text-on-surface-variant">{tx.note}</p>}
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'credit' ? 'text-primary' : 'text-error'}`}>{tx.type === 'credit' ? '+' : '-'}{formatMoney(tx.amount, account || undefined)}</p>
                  {tx.id && <button onClick={() => removeTransaction(tx.id!)} className="mt-2 inline-flex items-center gap-1 text-body-sm font-bold text-error"><Trash2 className="h-4 w-4" /> Delete</button>}
                </div>
              </article>
            ))}
            {!filtered.length && <div className="rounded-3xl border border-dashed border-surface-container p-12 text-center text-on-surface-variant">No matching transactions.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

function Panel({ eyebrow, title, icon: Icon, children, id }: { eyebrow: string; title: string; icon: LucideIcon; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="rounded-[2rem] border border-surface-container bg-surface p-5 card-shadow">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-label-caps font-black uppercase tracking-widest text-on-surface-variant">{eyebrow}</p>
          <h2 className="text-title-md font-black">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function ModeButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-12 rounded-2xl px-3 text-body-sm font-black transition ${
        active ? 'bg-on-surface text-surface' : 'bg-surface-container-low text-on-surface-variant'
      }`}
    >
      {label}
    </button>
  );
}
