import { NavLink } from 'react-router-dom';
import { Brain, Home, LineChart, Receipt, Settings } from 'lucide-react';

export default function BottomNav() {
  const tabs = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Receipt, label: 'Capture', path: '/activity' },
    { icon: LineChart, label: 'Forecast', path: '/forecast' },
    { icon: Brain, label: 'Coach', path: '/coach' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 grid w-[min(94vw,620px)] -translate-x-1/2 grid-cols-5 gap-1 rounded-[1.75rem] bg-inverse-surface/95 p-2 shadow-2xl backdrop-blur">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex min-h-14 flex-col items-center justify-center rounded-2xl text-[10px] font-black transition-all ${
              isActive ? 'bg-surface text-on-surface' : 'text-secondary-fixed-dim hover:bg-white/10'
            }`
          }
        >
          <tab.icon className="mb-1 h-5 w-5" />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
