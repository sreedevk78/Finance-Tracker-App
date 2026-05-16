import { Bell, Sparkles, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ title }: { title: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex justify-between items-center px-container-margin py-md sticky top-0 bg-background/80 backdrop-blur-md z-40">
      <div className="flex items-center gap-2">
        {user?.photoURL ? (
          <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-surface-container-highest" alt="Profile" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold">
            {user?.displayName?.[0] || 'A'}
          </div>
        )}
      </div>
      <h1 className="text-title-md font-display-lg text-primary tracking-tight">{title}</h1>
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/settings')} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
          <Settings className="w-5 h-5 opacity-60" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container text-primary">
          <Sparkles className="w-5 h-5 fill-current" />
        </button>
      </div>
    </header>
  );
}
