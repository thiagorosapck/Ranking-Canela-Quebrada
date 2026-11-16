import type { League } from '../types';

export default function LeagueSelect({ leagues, value, onChange }: { leagues: League[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div className="w-48">
      <label htmlFor="league-select">Liga</label>
      <select id="league-select" value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {leagues.map((l) => <option key={l.name} value={l.name}>{l.name}{l.active ? ' (ativa)' : ''}</option>)}
      </select>
    </div>
  );
}
