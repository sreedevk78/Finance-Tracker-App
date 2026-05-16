import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ShoppingBag, Sparkles, ChevronRight, Info } from 'lucide-react';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Forecast() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [simulationResult, setSimulationResult] = useState<{ delay: number; goal: string } | null>(null);
  const [projectedBalance, setProjectedBalance] = useState(14250);
  const [primaryGoal, setPrimaryGoal] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      const data = snap.data();
      setProfile(data);
      if (data?.primaryGoal) setPrimaryGoal({ title: data.primaryGoal });
    });
  }, [user]);

  const handleSimulate = () => {
    if (!amount) return;
    // Mock simulation logic based on income vs spend
    const delay = Math.ceil(Number(amount) / 100); 
    setSimulationResult({
      delay,
      goal: primaryGoal?.title || 'Summer Vacation'
    });
  };

  return (
    <div className="bg-background min-h-screen">
      <TopBar title="Forecast" />
      
      <main className="pt-4 pb-[120px] px-container-margin flex flex-col gap-lg">
        {/* Projected Header */}
        <section className="flex flex-col gap-base items-center text-center mt-sm">
          <span className="text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">Projected Balance (90 Days)</span>
          <h2 className="text-display-lg font-bold">{profile?.currencySymbol || '$'}{projectedBalance.toLocaleString()}.00</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low rounded-full">
            <TrendingUp className="w-4 h-4 text-tertiary" />
            <span className="text-body-sm text-tertiary font-bold">+{profile?.currencySymbol || '$'}1,200 (9%) trajectory</span>
          </div>
        </section>

        {/* Forecast Chart */}
        <section className="bg-surface rounded-3xl p-6 card-shadow border border-surface-container/50 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-title-md font-bold">Trajectory</h3>
            <button className="text-on-surface-variant">
              <Info className="w-5 h-5" />
            </button>
          </div>
          
          <div className="h-[200px] w-full relative flex flex-col justify-end">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="chart-gradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffb68f" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#fcf9f5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M0,80 C30,70 50,20 100,10" 
                fill="none" 
                stroke="var(--color-primary)" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              <path d="M0,80 C30,70 50,20 100,10 L100,100 L0,100 Z" fill="url(#chart-gradient)" />
              <motion.circle 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                cx="50" cy="38" r="4" fill="white" stroke="var(--color-primary)" strokeWidth="2" 
              />
            </svg>
            <div className="flex justify-between mt-auto pt-4 border-t border-surface-container text-label-caps text-on-surface-variant font-bold">
              <span>TODAY</span>
              <span>JUL</span>
              <span>AUG</span>
            </div>
          </div>
        </section>

        {/* Purchase Simulator */}
        <section className="bg-surface rounded-3xl p-6 card-shadow border border-surface-container/50 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-fixed/20 flex items-center justify-center text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-title-md font-bold">Purchase Simulator</h3>
              <p className="text-body-sm text-on-surface-variant">See how an expense affects your goals.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="absolute top-2 left-4 text-label-caps text-on-surface-variant font-bold">AMOUNT</label>
              <div className="absolute left-4 bottom-3 text-on-surface font-bold text-title-md">{profile?.currencySymbol || '$'}</div>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00" 
                className="w-full bg-surface-container-low h-16 rounded-2xl pt-6 pl-8 pr-4 font-bold text-title-md border-none focus:ring-2 focus:ring-primary-container"
              />
            </div>
            <button 
              onClick={handleSimulate}
              className="w-full bg-primary text-on-primary h-14 rounded-2xl font-bold glow-shadow active:scale-[0.98] transition-all"
            >
              SIMULATE IMPACT
            </button>
          </div>

          <AnimatePresence>
            {simulationResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-surface-container-low border border-primary-container/20 rounded-2xl p-4 flex gap-4"
              >
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-1 fill-current" />
                <div className="flex flex-col gap-1">
                  <span className="text-label-caps text-primary font-bold uppercase">Aura Insight</span>
                  <p className="text-body-md text-on-surface">
                    This purchase will delay your <strong className="font-bold">{simulationResult.goal}</strong> goal by {simulationResult.delay} days.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
