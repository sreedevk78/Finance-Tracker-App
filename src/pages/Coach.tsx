import { useState, useRef, useEffect } from 'react';
import TopBar from '../components/layout/TopBar';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, PlusCircle, ArrowUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Coach() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'aura',
      text: "Based on our talk yesterday about your travel goal, I've run some new projections. Reallocating 15% of your dining spend puts you <span class='text-primary font-bold'>1.5 months ahead</span> of schedule.",
      hasChart: true
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then(snap => setProfile(snap.data()));
    }
  }, [user]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          context: {
            ageGroup: profile?.ageGroup,
            taxpayerStatus: profile?.taxpayerStatus,
            currency: profile?.currency,
            persona: profile?.financialPersona,
            primaryGoal: profile?.primaryGoal,
            income: profile?.monthlyIncome
          } 
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'aura', text: data.text }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <TopBar title="Aura" />
      
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-container-margin py-6 space-y-8 hide-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'aura' && (
                <div className="flex items-center gap-2 mb-2 pl-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-on-primary">
                    <Sparkles className="w-3 h-3 fill-current" />
                  </div>
                  <span className="text-label-caps text-on-surface-variant font-bold uppercase tracking-widest">Aura</span>
                </div>
              )}
              
              <div 
                className={`max-w-[90%] p-6 rounded-3xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-surface-container-high text-on-surface rounded-br-sm' 
                    : 'bg-surface text-on-surface rounded-bl-sm card-shadow border border-surface-container/50'
                }`}
              >
                <div className="text-body-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text }} />
                
                {msg.hasChart && (
                  <div className="mt-6 p-4 bg-surface-container-low rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-title-md">Projection Shift</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-label-caps font-bold rounded-full">+1.5 mo</span>
                    </div>
                    <div className="h-20 flex items-end justify-between gap-1 px-2">
                      {[20, 40, 65, 85, 100, 70].map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          className={`w-full rounded-t-full ${i === 4 ? 'bg-primary' : 'bg-primary-container'}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-label-caps text-on-surface-variant">
                      <span>Now</span>
                      <span>Target</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && <div className="text-label-caps text-secondary pl-2 animate-pulse">Aura is thinking...</div>}
      </main>

      {/* Input Area */}
      <div className="px-container-margin pb-32 pt-4 bg-gradient-to-t from-background via-background to-transparent sticky bottom-0">
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          {['Predict my balance', 'Explain my burn rate', 'Japan travel goal'].map((chip) => (
            <button 
              key={chip}
              onClick={() => setInput(chip)}
              className="shrink-0 px-4 py-2 bg-surface rounded-full border border-surface-container text-body-sm whitespace-nowrap hover:bg-surface-container transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
        
        <div className="bg-surface rounded-full p-2 flex items-center card-shadow border-2 border-transparent focus-within:border-primary-container/30 transition-all">
          <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
            <PlusCircle className="w-6 h-6" />
          </button>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            type="text" 
            placeholder="Ask Aura..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-body-lg px-2"
          />
          <button 
            onClick={handleSend}
            className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary rounded-full shadow-lg active:scale-95 transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
