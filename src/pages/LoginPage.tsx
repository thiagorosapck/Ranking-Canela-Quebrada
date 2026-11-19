import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ErrorBox } from '../components/ui';
import { initialOAuthError } from '../lib/supabase';

export default function LoginPage() {
  const { signInWithDiscord } = useAuth();
  const [error, setError] = useState<string | null>(initialOAuthError);
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      await signInWithDiscord();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold-500 bg-blood-700 text-4xl shadow-glow">⚔️</div>
        <h1 className="text-3xl font-black tracking-[0.2em] sm:text-4xl">CANELA QUEBRADA</h1>
        <p className="mt-1 text-lg italic text-parch/70">Ranking Oficial da Liga</p>
        <div className="divider my-6" />
        <p className="mb-6 text-parch/80">Entre com sua conta do Discord para participar das competições internas do clã.</p>
        <button className="btn btn-gold w-full !bg-[#5865F2] !from-[#5865F2] !to-[#4752c4] !text-white" onClick={() => void go()} disabled={busy}>
          {busy ? 'Redirecionando…' : 'Entrar com Discord'}
        </button>
        {error && <div className="mt-4"><ErrorBox message={error} /></div>}
        <p className="mt-6 font-ui text-xs text-parch/50">Capturamos apenas seu nome, avatar e ID do Discord.</p>
      </div>
    </div>
  );
}
