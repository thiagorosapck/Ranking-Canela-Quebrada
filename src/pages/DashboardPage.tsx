import { useMemo } from 'react';
import { ErrorBox, PageTitle, Panel, Spinner, Stat, StatusBadge, TrophyBadge } from '../components/ui';
import LeagueSelect from '../components/LeagueSelect';
import { getLeaderboard, getRecentSubmissions, subscribeRanking } from '../lib/api';
import { formatDateTime, formatPlayed } from '../lib/time';
import { computeTrophies } from '../lib/trophies';
import { useLeague, useRankingData } from '../lib/useLeague';
import type { TrophyKind } from '../types';

export default function DashboardPage() {
  const { leagues, league, setLeague } = useLeague();
  const load = () => (league ? Promise.all([getLeaderboard(league), getRecentSubmissions(league)]) : Promise.resolve(null));
  const { data, error } = useRankingData(load, [league], subscribeRanking);

  const stats = useMemo(() => {
    const rows = data?.[0] ?? [];
    const times = rows.map((r) => r.played_seconds).filter((n): n is number => n !== null);
    return {
      total: rows.length,
      avg: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null,
      min: times.length ? Math.min(...times) : null,
      max: times.length ? Math.max(...times) : null,
      trophies: Object.entries(computeTrophies(rows)) as [TrophyKind, (typeof rows)[number]][],
    };
  }, [data]);

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Panorama geral da liga." />
      <div className="mb-4 flex justify-end"><LeagueSelect leagues={leagues} value={league} onChange={setLeague} /></div>
      {error && <ErrorBox message={error} />}
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Participantes" value={stats.total} />
            <Stat label="Média de /played" value={formatPlayed(stats.avg)} />
            <Stat label="Menor tempo" value={formatPlayed(stats.min)} />
            <Stat label="Maior tempo" value={formatPlayed(stats.max)} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel title="Troféus atuais">
              {stats.trophies.length === 0 && <p className="text-parch/60">Nenhum troféu atribuído ainda.</p>}
              <ul className="space-y-3">
                {stats.trophies.map(([k, r]) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <TrophyBadge kind={k} />
                    <span className="font-ui text-sm text-gold-200">{r.character_name ?? r.discord_name} · {formatPlayed(r.played_seconds)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
            <Panel title="Últimas submissões">
              <ul className="space-y-3">
                {data[1].map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 font-ui text-sm">
                    <span>
                      <strong className="text-gold-200">{s.profiles?.character_name ?? s.profiles?.discord_name ?? '—'}</strong>
                      <span className="text-parch/60"> · Lv {s.level ?? '?'} · {formatPlayed(s.played_seconds)}</span>
                      <br /><span className="text-xs text-parch/50">{formatDateTime(s.created_at)}</span>
                    </span>
                    <StatusBadge tone={s.status === 'approved' ? 'green' : s.status === 'rejected' ? 'red' : 'gray'}>
                      {s.status === 'approved' ? 'Aprovado' : s.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </StatusBadge>
                  </li>
                ))}
                {data[1].length === 0 && <p className="text-parch/60">Sem submissões.</p>}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
