import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBox, PageTitle, Panel, StatusBadge, Avatar } from '../components/ui';
import { listLeagues, listMySubmissions, updateProfile } from '../lib/api';
import { CLASSES } from '../lib/poe';
import { formatDate, formatDateTime, formatPlayed } from '../lib/time';
import type { League, Submission } from '../types';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [form, setForm] = useState({ character_name: profile?.character_name ?? '', class: profile?.class ?? '', ascendancy: profile?.ascendancy ?? '', league: profile?.league ?? '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    void listLeagues().then(setLeagues).catch(() => undefined);
    void listMySubmissions(profile.id).then(setSubs).catch(() => undefined);
  }, [profile]);

  if (!profile) return null;
  const ascendancies = form.class ? CLASSES[form.class] ?? [] : [];

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await updateProfile(profile!.id, {
        character_name: form.character_name.trim() || null,
        class: form.class || null,
        ascendancy: form.ascendancy || null,
        league: form.league || null,
      });
      await refreshProfile();
      setMsg({ ok: true, text: 'Perfil salvo.' });
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageTitle title="Perfil do Jogador" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Dados">
          <div className="mb-4 flex items-center gap-3">
            <Avatar src={profile.avatar_url} name={profile.discord_name} size={56} />
            <div className="font-ui text-sm">
              <p className="text-lg text-gold-200">{profile.discord_name}</p>
              <p className="text-parch/60">Discord ID: {profile.discord_id}</p>
              <p className="text-parch/60">Inscrito em {formatDate(profile.created_at)}</p>
            </div>
          </div>
          <form onSubmit={(e) => void save(e)} className="space-y-4">
            <div><label htmlFor="cn">Nome do personagem</label>
              <input id="cn" value={form.character_name} maxLength={40} onChange={(e) => setForm({ ...form, character_name: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="cl">Classe</label>
                <select id="cl" value={form.class} onChange={(e) => setForm({ ...form, class: e.target.value, ascendancy: '' })}>
                  <option value="">—</option>{Object.keys(CLASSES).map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label htmlFor="as">Ascendancy</label>
                <select id="as" value={form.ascendancy} onChange={(e) => setForm({ ...form, ascendancy: e.target.value })} disabled={!form.class}>
                  <option value="">—</option>{ascendancies.map((a) => <option key={a}>{a}</option>)}</select></div>
            </div>
            <div><label htmlFor="lg">League</label>
              <select id="lg" value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })}>
                <option value="">—</option>{leagues.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}</select></div>
            {msg && (msg.ok ? <p className="font-ui text-sm text-emerald-300">{msg.text}</p> : <ErrorBox message={msg.text} />)}
            <button className="btn btn-gold" disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</button>
          </form>
        </Panel>
        <Panel title="Meus envios" right={<Link to="/enviar" className="btn btn-ghost">Novo envio</Link>}>
          <ul className="space-y-3">
            {subs.map((s) => (
              <li key={s.id} className="rounded border border-gold-700/30 p-3 font-ui text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gold-200">Lv {s.level ?? '?'} · {formatPlayed(s.played_seconds)}</span>
                  <StatusBadge tone={s.status === 'approved' ? 'green' : s.status === 'rejected' ? 'red' : 'gray'}>
                    {s.status === 'approved' ? 'Aprovado' : s.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </StatusBadge>
                </div>
                <p className="text-xs text-parch/50">{formatDateTime(s.created_at)} · {s.league}</p>
                {s.status === 'rejected' && <p className="mt-1 text-red-300">Motivo: {s.reject_reason} — <Link to="/enviar">envie novamente</Link>.</p>}
              </li>
            ))}
            {subs.length === 0 && <p className="text-parch/60">Você ainda não enviou evidências.</p>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
