import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Flame, Receipt, AlertCircle, Sparkles, ShieldCheck, Activity as ActivityIcon } from 'lucide-react';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Insights() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [stats, setScoreStats] = useState({ income: 0, spending: 0 });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch Profile
    getDoc(doc(db, 'users', user.uid)).then(snap => setProfile(snap.data()));

    // Load Income
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const income = Number(snap.data()?.monthlyIncome) || 3000;
      
      // Load Spending & Subscription Detection
      const q = query(collection(db, 'users', user.uid, 'transactions'));
      onSnapshot(q, snap => {
        const docs = snap.docs.map(d => d.data());
        const totalSpend = docs.reduce((acc, d) => acc + d.amount, 0);
        setScoreStats({ income, spending: totalSpend });
        
        // Subscription detection: Find merchants with more than 1 charge
        const merchants: Record<string, any[]> = {};
        docs.forEach(d => {
          if (!merchants[d.merchantName]) merchants[d.merchantName] = [];
          merchants[d.merchantName].push(d);
        });

        const detectedSubs = Object.entries(merchants)
          .filter(([_, txs]) => txs.length > 1)
          .map(([name, txs]) => ({
            name,
            amount: txs[0].amount,
            confidence: txs.length >= 3 ? 95 : 70
          }));
        
        setSubscriptions(detectedSubs);

        const ratio = income / (totalSpend + 1);
        const calcScore = docs.length === 0 ? 0 : Math.min(100, Math.max(20, Math.round(ratio * 40)));
        setScore(calcScore);
      });
    });
  }, [user]);

  return (
    <div className="bg-background min-h-screen">
      <TopBar title="Financial Health" />
      
      <main className="px-container-margin flex flex-col gap-lg pb-10">
        {/* Progress Gauges... (rest of existing UI) */}

        {/* Detected Subscriptions */}
        <section className="space-y-4">
          <h3 className="text-label-caps font-bold px-2 opacity-50 tracking-widest uppercase">Detected Subscriptions</h3>
          <div className="flex flex-col gap-4">
            {subscriptions.map((sub) => (
              <div key={sub.name} className="bg-surface rounded-3xl p-5 card-shadow border border-surface-container/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold">{sub.name}</h4>
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary fill-current" />
                      {sub.confidence}% Certainty
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{profile?.currencySymbol || '$'}{sub.amount}</p>
                  <p className="text-label-caps text-on-surface-variant text-[10px]">RECURRING</p>
                </div>
              </div>
            ))}
            {subscriptions.length === 0 && (
              <div className="p-6 text-center text-on-surface-variant bg-surface-container-low rounded-3xl border border-dashed border-surface-container">
                <p className="text-body-sm">No recurring patterns detected yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Health Score Card */}
        <section className="bg-surface rounded-3xl p-8 card-shadow relative overflow-hidden text-center border border-surface-container/50">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl opacity-50"></div>
          
          <h2 className="text-title-md font-bold mb-1">Financial Health Score</h2>
          <p className="text-body-sm text-on-surface-variant mb-8 uppercase tracking-widest font-bold opacity-60">Overall Well-being</p>
          
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-container" />
              <motion.circle 
                cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" 
                strokeLinecap="round" strokeDasharray="282.7" 
                animate={{ strokeDashoffset: 282.7 - (2.827 * score) }} 
                className="text-primary" transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-[56px] font-bold tracking-tighter leading-none">{score}</span>
              <span className="text-label-caps text-on-surface-variant font-bold mt-2 opacity-50">/ 100</span>
            </div>
          </div>
          
          <div className="mt-8">
            <span className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 text-primary text-label-caps font-black letter spacing tracking-widest uppercase">
              <ShieldCheck className="w-4 h-4" /> 
              {score === 0 ? 'CALIBRATING...' : score > 80 ? 'EXCELLENT STANDING' : score > 50 ? 'GOOD STANDING' : 'NEEDS ATTENTION'}
            </span>
          </div>
        </section>

        {/* Indicators */}
        {score > 0 && (
          <section className="space-y-4">
            <h3 className="text-label-caps font-bold px-2 opacity-50 tracking-widest uppercase italic">Stability Indicators</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { label: score > 70 ? 'High Liquidity' : 'Standard Liquidity', color: 'bg-primary-container' },
                { label: 'Diversified', color: 'bg-tertiary' },
                { label: stats.spending < stats.income ? 'Stable Burn Rate' : 'High Burn Rate', color: stats.spending < stats.income ? 'bg-secondary' : 'bg-error' }
              ].map((tag) => (
                <div key={tag.label} className="px-4 py-3 bg-surface rounded-full card-shadow border border-surface-container/50 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tag.color}`}></div>
                  <span className="text-body-sm font-bold">{tag.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-4">
          <motion.div whileTap={{ scale: 0.98 }} className="bg-surface rounded-3xl p-6 card-shadow border border-surface-container/50">
            <div className="w-10 h-10 rounded-full bg-primary-fixed/30 flex items-center justify-center mb-4">
              <Flame className="w-5 h-5 text-primary fill-current" />
            </div>
            <h4 className="text-body-sm font-bold uppercase opacity-50 tracking-widest">Habits</h4>
            <p className="text-title-md font-bold mb-4">Consistent Saver</p>
            <div className="flex items-baseline gap-1">
              <span className="text-headline-lg-mobile font-bold text-primary">14</span>
              <span className="text-label-caps font-bold text-on-surface-variant opacity-60">Months</span>
            </div>
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }} className="bg-surface rounded-3xl p-6 card-shadow border border-surface-container/50">
            <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center mb-4">
              <ActivityIcon className="w-5 h-5 text-error" />
            </div>
            <h4 className="text-body-sm font-bold uppercase opacity-50 tracking-widest">Creep</h4>
            <p className="text-title-md font-bold mb-4">Burn Rate</p>
            <div className="flex items-baseline gap-1">
              <span className="text-headline-lg-mobile font-bold text-error">{profile?.currencySymbol || '$'}{stats.spending.toLocaleString()}</span>
              <span className="text-label-caps font-bold text-on-surface-variant opacity-60">/mo</span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
