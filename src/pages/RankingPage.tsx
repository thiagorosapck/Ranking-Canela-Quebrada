import { useMemo } from 'react';
import { Avatar, ErrorBox, Medal, PageTitle, Panel, Spinner, StatusBadge, TrophyBadge } from '../components/ui';
import LeagueSelect from '../components/LeagueSelect';
import { getLeaderboard, subscribeRanking } from '../lib/api';
import { formatPlayed } from '../lib/time';
import { sortRanking, statusLabel, trophiesByUser, TROPHIES } from '../lib/trophies';
import { useLeague, useRankingData } from '../lib/useLeague';

export default function RankingPage() {
  const { leagues, league, setLeague } = useLeague();
  const { data, error } = useRankingData(() => (league ? getLeaderboard(league) : Promise.resolve([])), [league], subscribeRanking);
  const sorted = useMemo(() => sortRanking(data ?? []), [data]);
  const trophies = useMemo(() => trophiesByUser(data ?? []), [data]);

  return (
    <>
      <PageTitle title="Ranking" subtitle="Leaderboard em tempo real — apenas evidências aprovadas contam." />
      <Panel right={<LeagueSelect leagues={leagues} value={league} onChange={setLeague} />}>
        {error && <ErrorBox message={error} />}
        {!data && !error && <Spinner />}
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gold-700/50">
                  {['Pos', 'Jogador', 'Classe', 'Level', 'Played', 'Voidstones', 'Status', 'Troféu'].map((h) => <th key={h} className="th">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {sorted.map((r, i) => {
                  const st = statusLabel(r);
                  const ts = trophies.get(r.user_id) ?? [];
                  return (
                    <tr key={r.user_id} className={`border-b border-gold-700/20 ${i < 3 && r.submission_id ? 'bg-gold-700/10' : ''}`}>
                      <td className="td text-lg"><Medal position={i + 1} /></td>
                      <td className="td">
                        <div className="flex items-center gap-2">
                          <Avatar src={r.avatar_url} name={r.discord_name} />
                          <div>
                            <p className="font-semibold text-gold-200">{r.character_name ?? '—'}</p>
                            <p className="text-xs text-parch/60">{r.discord_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">{r.ascendancy ?? r.class ?? '—'}</td>
                      <td className="td font-semibold text-gold-200">{r.level ?? '—'}</td>
                      <td className="td tabular-nums">{formatPlayed(r.played_seconds)}</td>
                      <td className="td">{r.submission_id ? `${r.voidstones ?? 0}/4` : '—'}
                        {r.eldritch_done && <span title="Eldritch"> 🔮</span>}{r.originator_done && <span title="Originator"> 🕳️</span>}
                      </td>
                      <td className="td"><StatusBadge tone={st.tone}>{st.text}</StatusBadge></td>
                      <td className="td"><div className="flex flex-wrap gap-1">{ts.map((k) => <TrophyBadge key={k} kind={k} />)}</div></td>
                    </tr>
                  );
                })}
                {sorted.length === 0 && <tr><td colSpan={8} className="td text-center text-parch/60">Nenhum participante nesta liga ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Panel title="Regras dos troféus" className="mt-6">
        <ul className="grid gap-3 sm:grid-cols-2">
          {Object.entries(TROPHIES).map(([k, t]) => (
            <li key={k} className="font-ui text-sm"><span className="text-lg">{t.icon}</span> <strong className="text-gold-300">{t.label}:</strong> <span className="text-parch/80">{t.rule}</span></li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
