import { useState, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import { collection, query, where, onSnapshot, orderBy, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Target, ChevronRight, Plus, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Goals() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', deadline: '' });

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => setProfile(snap.data()));
    const q = query(collection(db, 'users', user.uid, 'goals'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const handleAddGoal = async () => {
    if (!user || !newGoal.title || !newGoal.targetAmount) return;
    try {
      const id = Date.now().toString();
      await setDoc(doc(db, 'users', user.uid, 'goals', id), {
        userId: user.uid,
        title: newGoal.title,
        targetAmount: Number(newGoal.targetAmount),
        currentAmount: 0,
        deadline: newGoal.deadline ? new Date(newGoal.deadline) : null,
        status: 'active',
        createdAt: new Date()
      });
      setShowAdd(false);
      setNewGoal({ title: '', targetAmount: '', deadline: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <TopBar title="Financial Goals" />
      
      <main className="px-container-margin flex flex-col gap-lg pb-10">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-display-lg-mobile font-bold">Your Ambitions</h2>
            <p className="text-body-sm text-on-surface-variant">Track and simulate your progress.</p>
          </div>
          <button 
            onClick={() => setShowAdd(true)}
            className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        </header>

        <section className="flex flex-col gap-4">
          <AnimatePresence>
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface rounded-3xl p-6 card-shadow border border-surface-container/50 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-title-md">{goal.title}</h3>
                      <div className="flex items-center gap-2 text-label-caps text-on-surface-variant">
                        <TrendingUp className="w-3 h-3 text-secondary" />
                        <span>ON TRACK</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-title-md">{profile?.currencySymbol || '$'}{(goal.targetAmount).toLocaleString()}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-label-caps text-on-surface-variant uppercase font-bold tracking-widest">
                    <span>Progress</span>
                    <span>{Math.round((goal.currentAmount / goal.targetAmount) * 100)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(goal.currentAmount / goal.targetAmount) * 100}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                    <Calendar className="w-4 h-4" />
                    <span>Target Date: {new Date(goal.deadline.seconds * 1000).toLocaleDateString()}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {goals.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 bg-surface-container rounded-full mx-auto flex items-center justify-center text-secondary">
                <Target className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-body-lg text-on-surface-variant">No goals yet. <br/>Start your first ambition.</p>
            </div>
          )}
        </section>
      </main>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 w-full bg-background rounded-t-[40px] p-container-margin pt-10 z-[70] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-surface-container rounded-full mx-auto mb-8" />
              <div className="space-y-6 max-w-sm mx-auto">
                <h3 className="text-display-lg-mobile font-bold tracking-tight">New Ambition</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-label-caps text-on-surface-variant font-bold">GOAL NAME</label>
                    <input 
                      value={newGoal.title}
                      onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                      placeholder="e.g., Japan Travel"
                      className="w-full h-14 rounded-2xl bg-surface-container-low px-4 text-title-md border-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-caps text-on-surface-variant font-bold">TARGET AMOUNT ({profile?.currencySymbol || '$'})</label>
                    <input 
                      type="number"
                      value={newGoal.targetAmount}
                      onChange={e => setNewGoal({...newGoal, targetAmount: e.target.value})}
                      placeholder="0.00"
                      className="w-full h-14 rounded-2xl bg-surface-container-low px-4 text-title-md border-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-caps text-on-surface-variant font-bold">DEADLINE (OPTIONAL)</label>
                    <input 
                      type="date"
                      value={newGoal.deadline}
                      onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                      className="w-full h-14 rounded-2xl bg-surface-container-low px-4 text-title-md border-none focus:ring-2 focus:ring-primary-container"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddGoal}
                  className="w-full bg-primary text-on-primary h-16 rounded-2xl font-bold glow-shadow active:scale-[0.98] transition-all"
                >
                  SET GOAL
                </button>
                <div className="h-10" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
