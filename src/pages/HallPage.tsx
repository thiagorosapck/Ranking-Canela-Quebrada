import { useEffect, useState } from 'react';
import { Avatar, ErrorBox, PageTitle, Panel, Spinner, TrophyBadge } from '../components/ui';
import { listHall } from '../lib/api';
import { formatDate, formatPlayed } from '../lib/time';
import type { HallEntry } from '../types';

export default function HallPage() {
  const [rows, setRows] = useState<HallEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { listHall().then(setRows).catch((e: Error) => setError(e.message)); }, []);

  return (
    <>
      <PageTitle title="Hall da Fama" subtitle="Os vencedores de todas as ligas." />
      <Panel>
        {error && <ErrorBox message={error} />}
        {!rows && !error && <Spinner />}
        {rows && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead><tr className="border-b border-gold-700/50">{['Liga', 'Vencedor', 'Troféu', 'Data', 'Played'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gold-700/20">
                    <td className="td font-semibold text-gold-200">{r.league}</td>
                    <td className="td"><div className="flex items-center gap-2"><Avatar src={r.avatar_url} name={r.player_name} />{r.player_name}</div></td>
                    <td className="td"><TrophyBadge kind={r.trophy} /></td>
                    <td className="td">{formatDate(r.awarded_at)}</td>
                    <td className="td tabular-nums">{formatPlayed(r.played_seconds)}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="td text-center text-parch/60">Nenhuma liga encerrada ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
