import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { Spinner } from './components/ui';
import { useAuth } from './context/AuthContext';
import { isConfigured } from './lib/supabase';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';
import HallPage from './pages/HallPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RankingPage from './pages/RankingPage';
import SubmitPage from './pages/SubmitPage';

export default function App() {
  const { session, profile, loading, isAdmin } = useAuth();

  if (!isConfigured) {
    return (
      <div className="mx-auto max-w-xl p-8">
        <div className="panel p-6">
          <h1 className="text-2xl">Configuração pendente</h1>
          <p className="mt-3">
            Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> em um arquivo <code>.env</code> (veja <code>.env.example</code>) e reinicie o <code>npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }
  if (loading) return <Spinner />;
  if (!session) return <LoginPage />;
  if (!profile) return <Spinner label="Criando seu perfil…" />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RankingPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="enviar" element={<SubmitPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="hall-da-fama" element={<HallPage />} />
        <Route path="admin" element={isAdmin ? <AdminPage /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
