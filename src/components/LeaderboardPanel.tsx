import React from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatTime } from '@/lib/sudoku';
import { Trophy, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardPanelProps {
  game: string;
  difficulty: string;
}

const difficultyLabels: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ game, difficulty }) => {
  const { getLeaderboard } = useGame();
  const entries = getLeaderboard(game, difficulty);

  return (
    <div className="bg-card border border-border rounded-lg p-4 neon-box w-full">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-display text-xs text-accent neon-text">
          SKOR TABLOSU
        </h3>
      </div>
      <p className="text-muted-foreground text-xs mb-3">
        {difficultyLabels[difficulty]} • Bu Hafta
      </p>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">Henüz skor yok</p>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 10).map((entry, i) => (
            <div
              key={`${entry.userId}-${i}`}
              className={`flex items-center justify-between py-2 px-3 rounded-md text-sm ${
                i === 0
                  ? 'bg-accent/10 border border-accent/30 neon-gold'
                  : i === 1
                    ? 'bg-muted/60 border border-border'
                    : i === 2
                      ? 'bg-secondary/10 border border-secondary/30'
                      : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold w-6 text-center ${
                  i === 0 ? 'text-accent' : i === 1 ? 'text-foreground' : i === 2 ? 'text-secondary' : 'text-muted-foreground'
                }`}>
                  {i + 1}
                </span>
                <span className="text-foreground font-medium truncate max-w-[120px]">
                  {entry.userName}
                </span>
              </div>
              <span className="font-mono text-primary font-semibold">
                {formatTime(entry.score)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPanel;
