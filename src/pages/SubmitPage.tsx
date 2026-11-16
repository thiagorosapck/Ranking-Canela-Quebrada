import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ErrorBox, PageTitle, Panel } from '../components/ui';
import { createSubmission, uploadEvidence, validateImage } from '../lib/api';
import { runOcr, type OcrResult } from '../lib/ocr';
import { formatPlayed, joinSeconds, splitSeconds } from '../lib/time';

export default function SubmitPage() {
  const { profile } = useAuth();
  const nav = useNavigate();
  const [played, setPlayed] = useState<File | null>(null);
  const [proof, setProof] = useState<File | null>(null);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [level, setLevel] = useState('');
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [voidstones, setVoidstones] = useState(0);
  const [flags, setFlags] = useState({ eldritch: false, originator: false, maps: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!profile) return null;
  const needsProof = flags.eldritch || flags.originator || flags.maps || voidstones > 0;

  async function onPlayed(file: File | null) {
    setPlayed(file);
    setOcr(null);
    if (!file) return;
    const err = validateImage(file);
    if (err) { setError(err); setPlayed(null); return; }
    setError(null);
    setOcrProgress(0);
    const r = await runOcr(file, setOcrProgress);
    setOcrProgress(null);
    setOcr(r);
    if (r.level) setLevel(String(r.level));
    if (r.playedSeconds) setTime(splitSeconds(r.playedSeconds));
  }

  function onProof(file: File | null) {
    if (file) {
      const err = validateImage(file);
      if (err) { setError(err); return; }
    }
    setError(null);
    setProof(file);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!played) return setError('Envie o screenshot do /played.');
    if (!profile!.league) return setError('Defina sua liga no perfil antes de enviar.');
    if (!profile!.character_name) return setError('Preencha o nome do personagem no perfil antes de enviar.');
    if (needsProof && !proof) return setError('Envie o screenshot que comprova as voidstones/conclusões marcadas.');
    const lvl = level ? parseInt(level, 10) : null;
    if (lvl !== null && (lvl < 1 || lvl > 100)) return setError('Level deve estar entre 1 e 100.');
    setBusy(true);
    try {
      const played_path = await uploadEvidence(profile!.id, played);
      const proof_path = proof ? await uploadEvidence(profile!.id, proof) : null;
      const secs = joinSeconds(time);
      const ocrMissing = !ocr || ocr.failed || (ocr.level === null && ocr.playedSeconds === null);
      await createSubmission({
        user_id: profile!.id,
        league: profile!.league!,
        played_path,
        proof_path,
        played_seconds: secs > 0 ? secs : null,
        level: lvl,
        voidstones,
        eldritch_done: flags.eldritch,
        originator_done: flags.originator,
        maps_bonus_done: flags.maps,
        ocr_text: ocr?.text.slice(0, 4000) ?? null,
        ocr_confidence: ocr?.confidence ?? null,
        ocr_failed: ocrMissing || secs === 0 || lvl === null,
      });
      nav('/perfil');
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const num = (v: string) => Math.max(0, parseInt(v || '0', 10) || 0);

  return (
    <>
      <PageTitle title="Enviar evidência" subtitle="Screenshot do /played com o level visível + prova das Voidstones." />
      <form onSubmit={(e) => void submit(e)} className="grid gap-6 lg:grid-cols-2">
        <Panel title="1 · Screenshot do /played">
          <label htmlFor="played">PNG, JPG ou WEBP — até 20 MB</label>
          <input id="played" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => void onPlayed(e.target.files?.[0] ?? null)} />
          {ocrProgress !== null && <p className="mt-3 font-ui text-sm text-gold-400 animate-pulse">Lendo imagem (OCR)… {Math.round(ocrProgress * 100)}%</p>}
          {ocr && (
            <p className={`mt-3 font-ui text-sm ${ocr.failed ? 'text-red-300' : 'text-emerald-300'}`}>
              {ocr.failed
                ? 'Não foi possível ler a imagem automaticamente. Preencha manualmente — um administrador vai revisar.'
                : `OCR detectou: Level ${ocr.level ?? '?'} · ${formatPlayed(ocr.playedSeconds)}. Confira abaixo.`}
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div><label htmlFor="lvl">Level</label><input id="lvl" inputMode="numeric" value={level} onChange={(e) => setLevel(e.target.value.replace(/\D/g, '').slice(0, 3))} /></div>
            <div><label htmlFor="vs">Voidstones (0–4)</label>
              <select id="vs" value={voidstones} onChange={(e) => setVoidstones(Number(e.target.value))}>{[0, 1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></div>
          </div>
          <p className="mt-4 text-xs font-ui font-medium uppercase tracking-wider text-gold-500">Tempo do /played</p>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {(['d', 'h', 'm', 's'] as const).map((k) => (
              <div key={k}><label htmlFor={`t-${k}`}>{{ d: 'Dias', h: 'Horas', m: 'Min', s: 'Seg' }[k]}</label>
                <input id={`t-${k}`} inputMode="numeric" value={time[k]} onChange={(e) => setTime({ ...time, [k]: num(e.target.value.replace(/\D/g, '')) })} /></div>
            ))}
          </div>
        </Panel>

        <Panel title="2 · Comprovação das Voidstones">
          <div className="space-y-3 font-ui text-sm">
            {([['eldritch', 'Eldritch concluído'], ['originator', 'Originator concluído'], ['maps', 'Todos os bônus de mapas concluídos']] as const).map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center gap-3 !text-sm !normal-case !tracking-normal !text-parch">
                <input type="checkbox" className="!w-5 accent-[#a8863f]" checked={flags[k]} onChange={(e) => setFlags({ ...flags, [k]: e.target.checked })} />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4">
            <label htmlFor="proof">Screenshot que comprova {needsProof ? '(obrigatório)' : '(opcional)'}</label>
            <input id="proof" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onProof(e.target.files?.[0] ?? null)} />
          </div>
          {error && <div className="mt-4"><ErrorBox message={error} /></div>}
          <button className="btn btn-gold mt-6 w-full" disabled={busy || ocrProgress !== null}>{busy ? 'Enviando…' : 'Enviar para validação'}</button>
          <p className="mt-3 font-ui text-xs text-parch/50">Seu envio será publicado no canal #validacao-ranking do Discord e ficará pendente até aprovação.</p>
        </Panel>
      </form>
    </>
  );
}
