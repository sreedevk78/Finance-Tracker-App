import { useState, useEffect, useMemo } from 'react';
import TopBar from '../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop as LaptopIcon, Coffee as CoffeeIcon, Dumbbell as FitnessIcon, Search as SearchIcon, AlertTriangle, Sparkles, CheckCircle2, ShoppingBag, Plane } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

export default function Activity() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Shopping', 'Food', 'Travel', 'Tech'];

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Delete this transaction?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => setProfile(snap.data()));
    const q = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = tx.merchantName.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || tx.categoryId.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, activeCategory]);

  const getIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'food': return CoffeeIcon;
      case 'shopping': return ShoppingBag;
      case 'travel': return Plane;
      case 'tech': return LaptopIcon;
      default: return CheckCircle2;
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <TopBar title="Activity" />
      
      <main className="px-container-margin flex flex-col gap-lg pb-10">
        {/* Search */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="relative w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 opacity-40" />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search transactions..." 
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-surface border-none focus:ring-2 focus:ring-primary-container text-body-lg card-shadow outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2 rounded-full font-bold text-label-caps whitespace-nowrap transition-all border border-transparent ${
                  activeCategory === cat 
                    ? 'bg-primary text-on-primary shadow-md' 
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container border-surface-container'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Trending Intelligence */}
        {filteredTransactions.length > 0 && filteredTransactions[0].amount > 500 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-label-caps font-bold px-1 opacity-50 tracking-widest uppercase">Intelligence</h2>
            <div className="bg-surface rounded-3xl p-6 card-shadow relative overflow-hidden group border border-surface-container/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container to-primary"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant">
                    <LaptopIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-title-md font-bold">{filteredTransactions[0].merchantName}</h3>
                    <p className="text-body-sm text-secondary">Large Purchase Detected</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error-container text-on-error-container text-[10px] font-bold uppercase">
                  <AlertTriangle className="w-3 h-3" /> UNUSUALLY LARGE
                </span>
              </div>
              <div className="mb-4 text-display-lg font-bold tracking-tight">
                {profile?.currencySymbol || '$'}{filteredTransactions[0].amount.toLocaleString()}
              </div>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container/50">
                <div className="flex gap-3 items-start">
                  <Sparkles className="w-5 h-5 text-primary-container shrink-0 mt-0.5 fill-current" />
                  <p className="text-body-sm text-on-surface-variant leading-relaxed">
                    This purchase is significantly larger than your baseline. It might affect your goal timelines.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* List */}
        <section className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-title-md font-bold">Recent History</h2>
            <span className="text-body-sm text-secondary font-bold">{filteredTransactions.length} items</span>
          </div>

          <div className="flex flex-col gap-4">
            {filteredTransactions.map((tx) => {
              const Icon = getIcon(tx.categoryId);
              return (
                <div key={tx.id} className="bg-surface rounded-3xl p-5 card-shadow flex flex-col gap-4 border border-surface-container/50">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-title-md font-bold">{tx.merchantName}</h4>
                        <p className="text-body-sm text-secondary">
                          {tx.date?.seconds ? new Date(tx.date.seconds * 1000).toLocaleDateString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-title-md font-bold">-{profile?.currencySymbol || '$'}{tx.amount.toLocaleString()}</span>
                      <button 
                        onClick={() => handleDelete(tx.id)}
                        className="p-2 text-on-surface-variant hover:text-error transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-20 opacity-30">
                <SearchIcon className="w-12 h-12 mx-auto mb-4" />
                <p className="text-body-lg font-bold">No transactions found.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
