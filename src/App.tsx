import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import { db } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import Activity from './pages/Activity';
import Insights from './pages/Insights';
import Goals from './pages/Goals';
import Coach from './pages/Coach';
import Forecast from './pages/Forecast';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Splash from './pages/Splash';

function AppRoutes() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        setIsOnboarded(snap.exists());
      });
    }
  }, [user]);

  if (showSplash) {
    return <Splash onFinish={() => setShowSplash(false)} />;
  }

  if (loading || (user && isOnboarded === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={() => setIsOnboarded(true)} />;
  }

  return (
    <div className="min-h-screen pb-32">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/coach" element={<Coach />} />
        <Route path="/settings" element={<Settings />} />
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
