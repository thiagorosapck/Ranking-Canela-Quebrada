import { useEffect, useState } from 'react';
import { listLeagues } from './api';
import type { League } from '../types';

/** Liga selecionada (padrão: ativa) + lista para o seletor. */
export function useLeague(preferred?: string | null) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [league, setLeague] = useState<string | null>(preferred ?? null);

  useEffect(() => {
    void listLeagues().then((ls) => {
      setLeagues(ls);
      setLeague((cur) => cur ?? ls.find((l) => l.active)?.name ?? ls[0]?.name ?? null);
    }).catch(() => undefined);
  }, []);

  return { leagues, league, setLeague };
}

export function useRankingData<T>(load: () => Promise<T>, deps: unknown[], subscribe: (cb: () => void) => () => void) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const run = () => load().then((d) => alive && setData(d)).catch((e: Error) => alive && setError(e.message));
    void run();
    const off = subscribe(() => void run());
    return () => { alive = false; off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error };
}
