import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isConfigured, supabase } from '../lib/supabase';
import { getProfile } from '../lib/api';
import type { Profile } from '../types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithDiscord: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) return setProfile(null);
    // O trigger do banco cria o perfil; tenta algumas vezes caso a replicação demore.
    for (let i = 0; i < 4; i++) {
      const p = await getProfile(s.user.id).catch(() => null);
      if (p) return setProfile(p);
      await new Promise((r) => setTimeout(r, 400));
    }
    setProfile(null);
  }, []);

  useEffect(() => {
    if (!isConfigured) return;
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      // fora do callback para evitar deadlock do cliente Supabase
      setTimeout(() => void loadProfile(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      profile,
      loading,
      isAdmin: profile?.role === 'admin',
      signInWithDiscord: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'discord',
          options: { redirectTo: window.location.origin + window.location.pathname, scopes: 'identify' },
        });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setProfile(null);
      },
      refreshProfile: () => loadProfile(session),
    }),
    [session, profile, loading, loadProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
