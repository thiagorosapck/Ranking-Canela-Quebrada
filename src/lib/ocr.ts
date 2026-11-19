import { joinSeconds } from './time';

export interface OcrResult {
  text: string;
  confidence: number;
  playedSeconds: number | null;
  level: number | null;
  /** true quando nenhum dos dois campos foi reconhecido -> revisão manual do admin */
  failed: boolean;
}

/**
 * Interpreta o texto do comando /played do Path of Exile, ex.:
 *   "You have played for 12 days, 3 hours, 4 minutes, 5 seconds."
 * Aceita também termos em português (dias/horas/minutos/segundos) e ruídos comuns de OCR.
 */
export function parsePlayed(text: string): number | null {
  const t = text.toLowerCase().replace(/[|]/g, '1');
  const unit = (re: RegExp): number => {
    const m = t.match(re);
    return m && m[1] ? parseInt(m[1], 10) : 0;
  };
  const d = unit(/(\d+)\s*(?:days?|dias?)/);
  const h = unit(/(\d+)\s*(?:hours?|horas?)/);
  const m = unit(/(\d+)\s*(?:minutes?|minutos?)/);
  const s = unit(/(\d+)\s*(?:seconds?|segundos?)/);
  if (d + h + m + s === 0 && !/(?:days?|dias?|hours?|horas?|minutes?|minutos?|seconds?|segundos?)/.test(t)) {
    return null;
  }
  const total = joinSeconds({ d, h, m, s });
  return total > 0 ? total : null;
}

/** Procura "Level 93", "Lvl 93", "Nível 93" ou "Lv. 93". Retorna o maior nível plausível (1–100). */
export function parseLevel(text: string): number | null {
  const re = /(?:level|lvl|lv\.?|n[ií]vel)\s*[:.]?\s*(\d{1,3})/gi;
  let best: number | null = null;
  for (const m of text.matchAll(re)) {
    const n = parseInt(m[1] ?? '', 10);
    if (n >= 1 && n <= 100 && (best === null || n > best)) best = n;
  }
  return best;
}

/** Roda o Tesseract.js no navegador (carregado sob demanda para não pesar o bundle inicial). */
export async function runOcr(file: File, onProgress?: (p: number) => void): Promise<OcrResult> {
  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') onProgress?.(m.progress);
      },
    });
    try {
      const { data } = await worker.recognize(file);
      const text = data.text ?? '';
      const playedSeconds = parsePlayed(text);
      const level = parseLevel(text);
      return {
        text,
        confidence: data.confidence ?? 0,
        playedSeconds,
        level,
        failed: playedSeconds === null && level === null,
      };
    } finally {
      await worker.terminate();
    }
  } catch {
    return { text: '', confidence: 0, playedSeconds: null, level: null, failed: true };
  }
}
