import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between bg-background/85 px-container-margin py-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {user?.user_metadata?.avatar_url ? (
          <img src={user.user_metadata.avatar_url} className="h-11 w-11 rounded-2xl border-2 border-surface-container" alt="Profile" />
        ) : (
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-on-surface text-surface font-black">A</div>
        )}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">{subtitle || 'Financial intelligence'}</p>
          <h1 className="text-title-md font-black tracking-normal text-on-surface">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1 rounded-full bg-primary/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-primary sm:flex">
          <ShieldCheck className="h-4 w-4" /> RLS
        </span>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-container text-on-primary-container">
          <Sparkles className="h-5 w-5 fill-current" />
        </div>
      </div>
    </header>
  );
}
