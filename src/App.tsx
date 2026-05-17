import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Forecast from './pages/Forecast';
import Goals from './pages/Goals';
import Coach from './pages/Coach';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Insights from './pages/Insights';
import { useFinanceData } from './hooks/useFinanceData';

function ConfigError() {
  return (
    <main className="min-h-screen bg-background p-container-margin flex items-center justify-center">
      <section className="max-w-xl rounded-[2rem] bg-surface p-8 card-shadow border border-surface-container">
        <p className="text-label-caps text-error font-black uppercase tracking-widest">Configuration required</p>
        <h1 className="mt-3 text-display-lg-mobile font-black tracking-normal">Supabase is not configured.</h1>
        <p className="mt-4 text-body-lg text-on-surface-variant leading-relaxed">
          Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local. Aura will not run with mocked financial data.
        </p>
      </section>
    </main>
  );
}

function AppRoutes() {
  const { user, loading, configured } = useAuth();
  const workspace = useFinanceData(user?.id);

  if (!configured) return <ConfigError />;
  if (loading || (user && workspace.loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Login />;
  if (!workspace.profile) return <Onboarding onComplete={workspace.refresh} />;

  return (
    <div className="min-h-screen pb-32 bg-background">
      {workspace.error && (
        <div className="mx-container-margin mt-3 rounded-2xl bg-error-container p-4 text-error font-bold">
          {workspace.error}
        </div>
      )}
      <Routes>
        <Route path="/" element={<Dashboard workspace={workspace} />} />
        <Route path="/activity" element={<Activity workspace={workspace} />} />
        <Route path="/insights" element={<Insights workspace={workspace} />} />
        <Route path="/forecast" element={<Forecast workspace={workspace} />} />
        <Route path="/goals" element={<Goals workspace={workspace} />} />
        <Route path="/coach" element={<Coach workspace={workspace} />} />
        <Route path="/settings" element={<Settings workspace={workspace} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
