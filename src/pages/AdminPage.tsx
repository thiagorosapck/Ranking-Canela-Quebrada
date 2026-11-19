import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar, ErrorBox, PageTitle, Panel, Spinner, StatusBadge } from '../components/ui';
import {
  createLeague, getLeaderboard, listAdminSubmissions, listLeagues, listProfiles, registerWinners, reviewSubmission,
  setActiveLeague, signedUrl,
} from '../lib/api';
import { formatDateTime, formatPlayed, joinSeconds, splitSeconds } from '../lib/time';
import { computeTrophies, TROPHIES } from '../lib/trophies';
import type { League, Profile, SubmissionWithProfile, TrophyKind, LeaderboardRow } from '../types';

type Tab = 'validacao' | 'ligas' | 'jogadores';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('validacao');
  const tabs: [Tab, string][] = [['validacao', 'Validação'], ['ligas', 'Ligas'], ['jogadores', 'Jogadores']];
  return (
    <>
      <PageTitle title="Painel Administrativo" subtitle="Aprove, rejeite e corrija evidências." />
      <div className="mb-4 flex gap-2">
        {tabs.map(([k, l]) => <button key={k} className={`btn ${tab === k ? 'btn-blood' : 'btn-ghost'}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'validacao' && <Validation />}
      {tab === 'ligas' && <Leagues />}
      {tab === 'jogadores' && <Players />}
    </>
  );
}

function Validation() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rows, setRows] = useState<SubmissionWithProfile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setRows(null);
    listAdminSubmissions(filter).then(setRows).catch((e: Error) => setError(e.message));
  }, [filter]);
  useEffect(load, [load]);

  return (
    <Panel right={
      <div className="w-44"><label htmlFor="flt">Filtro</label>
        <select id="flt" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
          <option value="pending">Pendentes</option><option value="approved">Aprovados</option><option value="rejected">Rejeitados</option><option value="all">Todos</option>
        </select></div>
    }>
      {error && <ErrorBox message={error} />}
      {!rows && !error && <Spinner />}
      <div className="space-y-4">
        {rows?.map((s) => <SubmissionCard key={s.id} s={s} onDone={load} />)}
        {rows?.length === 0 && <p className="text-parch/60">Nada por aqui.</p>}
      </div>
    </Panel>
  );
}

function SubmissionCard({ s, onDone }: { s: SubmissionWithProfile; onDone: () => void }) {
  const { profile } = useAuth();
  const [level, setLevel] = useState(String(s.level ?? ''));
  const [time, setTime] = useState(splitSeconds(s.played_seconds));
  const [voidstones, setVoidstones] = useState(s.voidstones);
  const [flags, setFlags] = useState({ e: s.eldritch_done, o: s.originator_done, m: s.maps_bonus_done });
  const [imgs, setImgs] = useState<{ played: string | null; proof: string | null }>({ played: null, proof: null });
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([signedUrl(s.played_path), s.proof_path ? signedUrl(s.proof_path) : Promise.resolve(null)]).then(([played, proof]) => setImgs({ played, proof }));
  }, [s.played_path, s.proof_path]);

  async function decide(decision: 'approved' | 'rejected') {
    setError(null);
    const lvl = level ? parseInt(level, 10) : null;
    if (decision === 'approved' && (lvl === null || joinSeconds(time) === 0)) return setError('Informe level e tempo antes de aprovar.');
    if (lvl !== null && (lvl < 1 || lvl > 100)) return setError('Level inválido.');
    setBusy(true);
    try {
      await reviewSubmission(s.id, profile!.id, decision, {
        level: lvl, played_seconds: joinSeconds(time), voidstones, eldritch_done: flags.e, originator_done: flags.o, maps_bonus_done: flags.m,
      }, reason);
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const n = (v: string) => Math.max(0, parseInt(v.replace(/\D/g, '') || '0', 10));

  return (
    <article className="rounded border border-gold-700/40 bg-void-900/60 p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar src={s.profiles?.avatar_url ?? null} name={s.profiles?.discord_name ?? '?'} />
          <div className="font-ui text-sm"><p className="text-gold-200">{s.profiles?.character_name ?? '—'} <span className="text-parch/50">({s.profiles?.discord_name})</span></p>
            <p className="text-xs text-parch/50">{formatDateTime(s.created_at)} · {s.league}</p></div>
        </div>
        <div className="flex gap-2">
          {s.ocr_failed && <StatusBadge tone="red">OCR falhou — revisar</StatusBadge>}
          <StatusBadge tone={s.status === 'approved' ? 'green' : s.status === 'rejected' ? 'red' : 'gray'}>{s.status}</StatusBadge>
        </div>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          {([['played', 'Screenshot /played'], ['proof', 'Comprovação']] as const).map(([k, label]) => imgs[k] ? (
            <a key={k} href={imgs[k]!} target="_blank" rel="noreferrer"><p className="font-ui text-xs text-gold-500">{label}</p>
              <img src={imgs[k]!} alt={label} className="max-h-56 w-full rounded border border-gold-700/40 object-contain bg-black" loading="lazy" /></a>
          ) : (k === 'played' ? <p key={k} className="text-xs text-parch/50">Carregando imagem…</p> : null))}
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label>Level</label><input inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value.replace(/\D/g, '').slice(0, 3))} /></div>
            <div><label>Voidstones</label><select value={voidstones} onChange={(e) => setVoidstones(Number(e.target.value))}>{[0, 1, 2, 3, 4].map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {(['d', 'h', 'm', 's'] as const).map((k) => (
              <div key={k}><label>{{ d: 'Dias', h: 'Horas', m: 'Min', s: 'Seg' }[k]}</label>
                <input inputMode="numeric" value={time[k]} onChange={(e) => setTime({ ...time, [k]: n(e.target.value) })} /></div>
            ))}
          </div>
          <p className="font-ui text-xs text-parch/50">Total: {formatPlayed(joinSeconds(time))}{s.ocr_confidence != null && ` · confiança OCR ${Math.round(s.ocr_confidence)}%`}</p>
          <div className="flex flex-wrap gap-4 font-ui text-sm">
            {([['e', 'Eldritch'], ['o', 'Originator'], ['m', 'Bônus de mapas']] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 !normal-case !tracking-normal !text-parch !text-sm !mb-0">
                <input type="checkbox" className="!w-4 accent-[#a8863f]" checked={flags[k]} onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })} />{l}</label>
            ))}
          </div>
          <div><label>Motivo da rejeição</label><input value={reason} placeholder="Ex.: imagem cortada, level ilegível…" onChange={(e) => setReason(e.target.value)} /></div>
          {error && <ErrorBox message={error} />}
          <div className="flex gap-2">
            <button className="btn btn-gold flex-1" disabled={busy} onClick={() => void decide('approved')}>✅ Aprovar</button>
            <button className="btn btn-blood flex-1" disabled={busy} onClick={() => void decide('rejected')}>❌ Rejeitar</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Leagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(() => void listLeagues().then(setLeagues).catch((e: Error) => setError(e.message)), []);
  useEffect(refresh, [refresh]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setError(null); setMsg(null);
    try { await fn(); setMsg(ok); refresh(); } catch (e) { setError((e as Error).message); }
  };

  async function close(league: string) {
    if (!window.confirm(`Encerrar "${league}" e registrar os vencedores no Hall da Fama?`)) return;
    const rows: LeaderboardRow[] = await getLeaderboard(league);
    const winners = Object.entries(computeTrophies(rows)).map(([kind, row]) => ({ kind: kind as TrophyKind, row }));
    if (winners.length === 0) throw new Error('Nenhum troféu a registrar (sem envios aprovados).');
    await registerWinners(league, winners);
  }

  return (
    <Panel title="Ligas">
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void run(async () => { await createLeague(name.trim()); setName(''); }, 'Liga criada.'); }}>
        <input placeholder="Nome da nova liga" value={name} onChange={(e) => setName(e.target.value)} minLength={2} required />
        <button className="btn btn-gold whitespace-nowrap">Criar</button>
      </form>
      {error && <ErrorBox message={error} />}
      {msg && <p className="mb-2 font-ui text-sm text-emerald-300">{msg}</p>}
      <ul className="space-y-2">
        {leagues.map((l) => (
          <li key={l.name} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gold-700/30 p-3 font-ui text-sm">
            <span className="text-gold-200">{l.name} {l.active && <StatusBadge tone="green">ativa</StatusBadge>} {l.closed_at && <StatusBadge tone="gray">encerrada</StatusBadge>}</span>
            <span className="flex gap-2">
              {!l.active && <button className="btn btn-ghost !py-1" onClick={() => void run(() => setActiveLeague(l.name), 'Liga ativada.')}>Ativar</button>}
              <button className="btn btn-blood !py-1" onClick={() => void run(() => close(l.name), 'Vencedores registrados no Hall da Fama.')}>Encerrar + Hall da Fama</button>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-ui text-xs text-parch/50">Troféus no encerramento: {Object.values(TROPHIES).map((t) => t.label).join(', ')}.</p>
    </Panel>
  );
}

function Players() {
  const [rows, setRows] = useState<Profile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { listProfiles().then(setRows).catch((e: Error) => setError(e.message)); }, []);
  return (
    <Panel title="Jogadores inscritos">
      {error && <ErrorBox message={error} />}
      {!rows && !error && <Spinner />}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead><tr className="border-b border-gold-700/50">{['Discord', 'Personagem', 'Classe', 'Liga', 'Papel'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>{rows?.map((p) => (
            <tr key={p.id} className="border-b border-gold-700/20">
              <td className="td"><div className="flex items-center gap-2"><Avatar src={p.avatar_url} name={p.discord_name} size={24} />{p.discord_name}</div></td>
              <td className="td">{p.character_name ?? '—'}</td><td className="td">{p.ascendancy ?? p.class ?? '—'}</td>
              <td className="td">{p.league ?? '—'}</td><td className="td">{p.role}</td>
            </tr>))}</tbody>
        </table>
      </div>
      <p className="mt-3 font-ui text-xs text-parch/50">Para promover um administrador, veja docs/MANUTENCAO.md.</p>
    </Panel>
  );
}
