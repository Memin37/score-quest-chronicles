const STORAGE_KEY = 'arena_pending_score';

export interface PendingScore {
  game: string;
  difficulty: string;
  score: number;
  returnPath: string;
}

export function savePendingScore(entry: PendingScore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function getPendingScore(): PendingScore | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingScore;
  } catch {
    return null;
  }
}

export function clearPendingScore() {
  localStorage.removeItem(STORAGE_KEY);
}
