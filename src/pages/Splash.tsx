import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';

export default function Splash({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-container-margin overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 1.1] }}
        transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 bg-primary-container rounded-[2.5rem] flex items-center justify-center glow-shadow">
          <Sparkles className="w-12 h-12 text-on-primary-container fill-current" />
        </div>
        <h1 className="text-display-lg font-bold text-primary tracking-normal">Aura</h1>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-primary-container"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
