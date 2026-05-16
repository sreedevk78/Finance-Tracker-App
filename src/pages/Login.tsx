import { signInWithGoogle } from '../lib/firebase';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-container-margin py-xl overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-primary-container/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-tertiary-container/10 rounded-full blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center gap-8 z-10"
      >
        <div className="w-16 h-16 bg-primary-container rounded-3xl flex items-center justify-center glow-shadow">
          <Sparkles className="w-8 h-8 text-on-primary-container fill-current" />
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-display-lg font-bold text-on-surface tracking-tighter">Sophisticated Finance</h1>
          <p className="text-body-lg text-on-surface-variant max-w-[280px] mx-auto">
            A behavior-aware companion for your financial future.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm space-y-4 z-10"
      >
        <button
          onClick={signInWithGoogle}
          className="w-full bg-on-background text-background h-[64px] rounded-2xl font-title-md flex items-center justify-between px-6 shadow-xl active:scale-[0.98] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            </div>
            <span>Continue with Google</span>
          </div>
          <ArrowRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <p className="text-body-sm text-center text-on-surface-variant px-8">
          By continuing, you agree to our <span className="text-on-surface font-semibold underline underline-offset-4">Terms of Service</span> and <span className="text-on-surface font-semibold underline underline-offset-4">Privacy Policy</span>.
        </p>
      </motion.div>
    </div>
  );
}
