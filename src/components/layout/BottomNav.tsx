import { NavLink } from 'react-router-dom';
import { Home, Receipt, LineChart, Target, Brain, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const tabs = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Receipt, label: 'Activity', path: '/activity' },
    { icon: LineChart, label: 'Forecast', path: '/forecast', center: true },
    { icon: Target, label: 'Goals', path: '/goals' },
    { icon: Brain, label: 'Coach', path: '/coach' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-inverse-surface shadow-2xl flex justify-around items-center px-4 pb-8 pt-4 z-50 rounded-t-[32px]">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all Active:scale-95 duration-200 ${
              tab.center
                ? 'relative -top-6'
                : isActive
                ? 'text-primary'
                : 'text-secondary-fixed-dim'
            }`
          }
        >
          {tab.center ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center glow-shadow border-4 border-inverse-surface">
                <tab.icon className="w-8 h-8 text-on-primary-container" />
              </div>
              <span className="font-label-caps text-[10px] mt-2 text-primary-container font-black">
                {tab.label.toUpperCase()}
              </span>
            </div>
          ) : (
            <>
              <tab.icon className="w-6 h-6 mb-1" />
              <span className="font-label-caps text-[10px] font-bold tracking-tighter">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
