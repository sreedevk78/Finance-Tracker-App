import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Plane, Wallet, TrendingUp, Sparkles, User, Globe, Coins } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [data, setData] = useState({
    ageGroup: '',
    taxpayerStatus: '',
    currency: 'USD',
    currencySymbol: '$',
    monthlyIncome: '',
    financialPersona: '',
    primaryGoal: '',
  });

  const personas = [
    { id: 'saver', label: 'Disciplined Saver', desc: 'I prioritize saving and safety.' },
    { id: 'spender', label: 'Active Spender', desc: 'I enjoy my money while I have it.' },
    { id: 'planner', label: 'Balanced Planner', desc: 'I like a healthy mix of both.' },
  ];

  const canContinue = () => {
    if (step === 1) return data.ageGroup && data.taxpayerStatus;
    if (step === 2) return !!data.currency;
    if (step === 3) return !!data.monthlyIncome;
    if (step === 4) return !!data.financialPersona;
    if (step === 5) return !!data.primaryGoal;
    return false;
  };

  const handleNext = () => {
    if (canContinue()) {
      if (step < totalSteps) setStep(s => s + 1);
      else handleFinish();
    }
  };

  const selectAndNext = (update: any) => {
    setData(prev => {
      const next = { ...prev, ...update };
      // Small delay for visual feedback then advance if it's a single-selection step
      if (step === 2 || step === 4 || step === 5) {
        setTimeout(() => setStep(s => Math.min(totalSteps, s + 1)), 300);
      }
      return next;
    });
  };

  const handleFinish = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        fullName: user.displayName,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        riskTolerance: 'medium'
      });
      onComplete();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background p-container-margin py-xl flex flex-col items-center">
      <div className="w-full max-w-sm flex-1 flex flex-col gap-10">
        <header className="flex justify-between items-center">
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 <= step ? 'bg-primary w-6' : 'bg-surface-container w-3'
                }`}
              />
            ))}
          </div>
          <span className="text-label-caps text-secondary font-bold">STEP {step}/{totalSteps}</span>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-lg"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center glow-shadow">
                  <User className="w-7 h-7 text-on-primary-container" />
                </div>
                <h2 className="text-display-lg-mobile font-bold tracking-tight">Tell us about yourself.</h2>
                <p className="text-body-lg text-on-surface-variant">This helps us tailor your insights.</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-label-caps font-bold opacity-60">AGE GROUP</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'under18', label: 'Under 18' },
                      { id: '18-24', label: '18-24' },
                      { id: '25-40', label: '25-40' },
                      { id: '40+', label: '40+' }
                    ].map(age => (
                      <button
                        key={age.id}
                        onClick={() => setData({ ...data, ageGroup: age.id })}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          data.ageGroup === age.id ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-surface-container text-on-surface-variant'
                        }`}
                      >
                        {age.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-label-caps font-bold opacity-60">STATUS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'taxpayer', label: 'Taxpayer' },
                      { id: 'non-taxpayer', label: 'Non-Taxpayer' }
                    ].map(status => (
                      <button
                        key={status.id}
                        onClick={() => setData({ ...data, taxpayerStatus: status.id })}
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          data.taxpayerStatus === status.id ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-surface-container text-on-surface-variant'
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-lg"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 bg-tertiary-container rounded-2xl flex items-center justify-center">
                  <Globe className="w-7 h-7 text-on-tertiary-container" />
                </div>
                <h2 className="text-display-lg-mobile font-bold tracking-tight">Pick your currency.</h2>
                <p className="text-body-lg text-on-surface-variant">We'll use this for all your metrics.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                    {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => selectAndNext({ currency: c.code, currencySymbol: c.symbol })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      data.currency === c.code 
                        ? 'border-primary bg-primary/5' 
                        : 'border-surface-container'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`text-title-md font-black ${data.currency === c.code ? 'text-primary' : 'text-on-surface'}`}>{c.symbol}</span>
                      <span className="text-label-caps text-[10px] opacity-60">{c.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-lg"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center glow-shadow">
                  <Wallet className="w-7 h-7 text-on-primary-container" />
                </div>
                <h2 className="text-display-lg-mobile font-bold tracking-tight">Let's set your foundation.</h2>
                <p className="text-body-lg text-on-surface-variant">
                  {data.ageGroup === 'under18' ? 'What is your typical monthly allowance?' : 'What is your typical monthly income after taxes?'}
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-title-md">{data.currencySymbol}</span>
                <input
                  type="number"
                  value={data.monthlyIncome}
                  onChange={(e) => setData({ ...data, monthlyIncome: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-surface-container-low h-16 rounded-2xl pl-12 pr-6 text-title-md border-none focus:ring-2 focus:ring-primary-container outline-none"
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-lg"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 bg-tertiary-container rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-on-tertiary-container" />
                </div>
                <h2 className="text-display-lg-mobile font-bold tracking-tight">Your financial style.</h2>
                <p className="text-body-lg text-on-surface-variant">How would you describe your spending behavior?</p>
              </div>
              <div className="space-y-3">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectAndNext({ financialPersona: p.id })}
                    className={`w-full p-6 rounded-3xl text-left transition-all ${
                      data.financialPersona === p.id 
                        ? 'bg-primary text-on-primary shadow-lg ring-4 ring-primary/10' 
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <p className={`font-bold ${data.financialPersona === p.id ? 'text-on-primary' : 'text-on-surface'}`}>{p.label}</p>
                    <p className={`text-body-sm mt-1 ${data.financialPersona === p.id ? 'text-on-primary/80' : 'text-on-surface-variant'}`}>{p.desc}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-lg"
            >
              <div className="space-y-4">
                <div className="w-14 h-14 bg-primary-container rounded-2xl flex items-center justify-center glow-shadow">
                  <Plane className="w-7 h-7 text-on-primary-container" />
                </div>
                <h2 className="text-display-lg-mobile font-bold tracking-tight">One final thing.</h2>
                <p className="text-body-lg text-on-surface-variant">What is your primary financial goal right now?</p>
              </div>
              <div className="space-y-3">
                {['Travel to Japan', 'Emergency Fund', 'Buy a Laptop', 'Invest in Tech'].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => selectAndNext({ primaryGoal: goal })}
                    className={`w-full p-5 rounded-2xl text-left flex items-center justify-between transition-all ${
                      data.primaryGoal === goal 
                        ? 'bg-primary text-on-primary' 
                        : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    <span className="font-bold">{goal}</span>
                    {data.primaryGoal === goal && <Sparkles className="w-5 h-5 fill-current" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm mt-10">
        <motion.button
          whileTap={{ scale: 0.95 }}
          animate={canContinue() ? { 
            scale: [1, 1.02, 1],
            boxShadow: [
              "0 10px 15px -3px rgba(0,0,0,0.1)",
              "0 20px 25px -5px rgba(0,0,0,0.2)",
              "0 10px 15px -3px rgba(0,0,0,0.1)"
            ]
          } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={handleNext}
          disabled={!canContinue()}
          className="w-full bg-on-background text-background h-[64px] rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-20 transition-all"
        >
          {step === totalSteps ? 'GIVE ME ACCESS' : 'CONTINUE'}
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
