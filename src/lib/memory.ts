const EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄',
  '🐙', '🦋', '🐢', '🐬', '🦀', '🐝', '🦅', '🐘',
];

export interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export type MemoryDifficulty = 'easy' | 'medium' | 'hard';

const GRID_CONFIG: Record<MemoryDifficulty, { pairs: number; cols: number }> = {
  easy: { pairs: 6, cols: 4 },
  medium: { pairs: 8, cols: 4 },
  hard: { pairs: 12, cols: 6 },
};

export const getGridConfig = (difficulty: MemoryDifficulty) => GRID_CONFIG[difficulty];

export function generateMemoryCards(difficulty: MemoryDifficulty): MemoryCard[] {
  const { pairs } = GRID_CONFIG[difficulty];
  const selected = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairs);
  const cards = [...selected, ...selected].map((emoji, i) => ({
    id: i,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
    cards[i].id = i;
    cards[j].id = j;
  }
  return cards;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const fractionalStr = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${fractionalStr}`;
}
