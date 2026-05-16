import TopBar from '../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Bolt, Plus, Laptop, Coffee, Dumbbell, AlertCircle, Sparkles, X, ChevronRight, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [primaryGoal, setPrimaryGoal] = useState<any>(null);
  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState({ amount: '', merchantName: '', categoryId: 'food' });

  useEffect(() => {
    if (!user) return;

    // Fetch Profile
    getDoc(doc(db, 'users', user.uid)).then(snap => setProfile(snap.data()));

    // Fetch Recent Transactions
    const tq = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(5));
    const unsubT = onSnapshot(tq, snap => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // Fetch Primary Goal
    const gq = query(collection(db, 'users', user.uid, 'goals'), limit(1));
    const unsubG = onSnapshot(gq, snap => {
      if (!snap.empty) setPrimaryGoal({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });

    return () => { unsubT(); unsubG(); };
  }, [user]);

  const handleAddTx = async () => {
    if (!user || !newTx.amount || !newTx.merchantName) return;
    try {
      const amountNum = Number(newTx.amount);
      const txId = Date.now().toString();
      await setDoc(doc(db, 'users', user.uid, 'transactions', txId), {
        userId: user.uid,
        amount: amountNum,
        merchantName: newTx.merchantName,
        categoryId: newTx.categoryId,
        type: 'debit',
        date: new Date(),
        createdAt: new Date(),
        isRecurring: false
      });

      // Update goal if exists
      if (primaryGoal) {
        await updateDoc(doc(db, 'users', user.uid, 'goals', primaryGoal.id), {
          currentAmount: increment(-amountNum) // Simplified: spending reduces local goal savings in this demo context
        });
      }

      setShowAddTx(false);
      setNewTx({ amount: '', merchantName: '', categoryId: 'food' });
    } catch (err) {
      console.error(err);
    }
  };

  const progress = primaryGoal ? Math.round((primaryGoal.currentAmount / primaryGoal.targetAmount) * 100) : 0;

  return (
    <div className="bg-background min-h-screen">
      <TopBar title="Aura" />
      
      <main className="px-container-margin flex flex-col gap-lg pb-10">
        {/* Savings Gauge */}
        <section className="flex flex-col items-center mt-sm">
          <div className="relative w-full max-w-[280px] aspect-[2/1] overflow-hidden mb-sm text-overlay">
            <div className="absolute inset-0 flex justify-between items-end gap-1 px-4">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const isActive = (i / 5) * 100 <= progress;
                return (
                  <div 
                    key={i} 
                    className={`w-full h-[120%] rounded-t-full origin-bottom transform ${
                      i === 0 ? '-rotate-[75deg]' : i === 1 ? '-rotate-[45deg]' : i === 2 ? '-rotate-[15deg]' : i === 3 ? 'rotate-[15deg]' : i === 4 ? 'rotate-[45deg]' : 'rotate-[75deg]'
                    } ${isActive ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
                  />
                );
              })}
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[140%] bg-background rounded-full"></div>
          </div>
          <div className="text-center mt-[-20px] relative z-10">
            <Bolt className="w-5 h-5 text-primary-container mx-auto mb-1 fill-current" />
            <p className="font-label-caps text-on-surface-variant uppercase tracking-wider mb-2">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}
            </p>
            <h2 className="text-display-lg tracking-tighter mb-1">
              {profile?.currencySymbol || '$'}{(primaryGoal?.currentAmount || 0).toLocaleString()}
            </h2>
            <p className="text-body-sm text-primary-container">Goal {profile?.currencySymbol || '$'}{(primaryGoal?.targetAmount || 0).toLocaleString()}</p>
          </div>
          <button 
            onClick={() => setShowAddTx(true)}
            className="w-full max-w-[280px] h-12 mt-6 rounded-xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </section>

        {/* Morning Insight */}
        {transactions.length >= 3 ? (
          <section className="bg-surface rounded-3xl p-6 card-shadow border border-surface-container/50">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary-fixed rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary fill-current" />
              </div>
              <div>
                <h3 className="text-title-md mb-1">Morning Insight</h3>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  You're on track to save <strong className="text-primary">{profile?.currencySymbol || '$'}450</strong> more this month based on your current routine.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-surface-container-low rounded-3xl p-6 border border-dashed border-surface-container">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Sparkles className="w-6 h-6 opacity-20" />
              </div>
              <div>
                <h3 className="text-body-md font-bold text-on-surface">Intelligence Warming Up</h3>
                <p className="text-body-sm text-on-surface-variant">Add a few more transactions to unlock behavior-aware insights.</p>
              </div>
            </div>
          </section>
        )}

        {/* Recent Intelligence */}
        <section className="flex flex-col gap-4">
          <h3 className="text-title-md px-2">Recent Intelligence</h3>
          <div className="flex flex-col gap-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-surface rounded-3xl p-5 card-shadow flex justify-between items-center border border-surface-container/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container border-2 border-surface-container flex items-center justify-center text-on-surface-variant">
                    {tx.categoryId === 'food' ? <Coffee className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-title-md leading-tight">{tx.merchantName}</span>
                    <span className="text-body-sm text-on-surface-variant">
                      {tx.date?.seconds ? new Date(tx.date.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-headline-lg-mobile leading-tight">-{profile?.currencySymbol || '$'}{tx.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-10 text-center text-on-surface-variant bg-surface rounded-3xl border border-dashed border-surface-container">
                No recent activity.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddTx && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddTx(false)} className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[60]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 left-0 w-full bg-background rounded-t-[40px] p-container-margin pt-10 z-[70] shadow-2xl">
              <div className="w-12 h-1.5 bg-surface-container rounded-full mx-auto mb-8" />
              <div className="space-y-6 max-w-sm mx-auto">
                <h3 className="text-display-lg-mobile font-bold tracking-tight">Manual Entry</h3>
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-title-md">{profile?.currencySymbol || '$'}</span>
                    <input type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} placeholder="0.00" className="w-full h-16 rounded-2xl bg-surface-container-low pl-12 pr-6 text-title-md border-none focus:ring-2 focus:ring-primary-container" />
                  </div>
                  <input value={newTx.merchantName} onChange={e => setNewTx({...newTx, merchantName: e.target.value})} placeholder="Merchant Name" className="w-full h-14 rounded-2xl bg-surface-container-low px-4 text-body-lg border-none focus:ring-2 focus:ring-primary-container" />
                  <select value={newTx.categoryId} onChange={e => setNewTx({...newTx, categoryId: e.target.value})} className="w-full h-14 rounded-2xl bg-surface-container-low px-4 text-body-lg border-none outline-none">
                    <option value="food">Food & Drink</option>
                    <option value="shopping">Shopping</option>
                    <option value="travel">Travel</option>
                    <option value="tech">Technology</option>
                  </select>
                </div>
                <button onClick={handleAddTx} className="w-full bg-primary text-on-primary h-16 rounded-2xl font-bold shadow-lg">SAVE TRANSACTION</button>
                <div className="h-10" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
