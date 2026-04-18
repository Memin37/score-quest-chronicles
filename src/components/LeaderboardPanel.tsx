import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatTime } from '@/lib/sudoku';
import { Trophy, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeaderboardPanelProps {
  game: string;
  difficulty: string;
}

const difficultyLabels: Record<string, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

type Tab = 'weekly' | 'alltime';

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ game, difficulty }) => {
  const { getLeaderboard, getAllTimeLeaderboard } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('weekly');

  const entries = tab === 'weekly'
    ? getLeaderboard(game, difficulty)
    : getAllTimeLeaderboard(game, difficulty);

  return (
    <div className="bg-card border border-border rounded-lg p-4 neon-box w-full">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-display text-xs text-accent neon-text">
          {t('leaderboardTitle')}
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 bg-muted/30 rounded-md p-0.5">
        <button
          onClick={() => setTab('weekly')}
          className={`flex-1 text-xs py-1.5 rounded transition-all font-medium ${tab === 'weekly'
            ? 'bg-accent/20 text-accent border border-accent/30'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('thisWeek')}
        </button>
        <button
          onClick={() => setTab('alltime')}
          className={`flex-1 text-xs py-1.5 rounded transition-all font-medium ${tab === 'alltime'
            ? 'bg-accent/20 text-accent border border-accent/30'
            : 'text-muted-foreground hover:text-foreground'
            }`}
        >
          {t('allTime')}
        </button>
      </div>

      <p className="text-muted-foreground text-xs mb-3">
        {t(difficulty)}
      </p>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm italic">{t('noScores')}</p>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 10).map((entry, i) => (
            <div
              key={`${entry.userId}-${i}`}
              className={`flex items-center justify-between py-2 px-3 rounded-md text-sm ${i === 0
                ? 'bg-accent/10 border border-accent/30 neon-gold'
                : i === 1
                  ? 'bg-muted/60 border border-border'
                  : i === 2
                    ? 'bg-secondary/10 border border-secondary/30'
                    : 'bg-muted/30'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold w-6 text-center ${i === 0 ? 'text-accent' : i === 1 ? 'text-foreground' : i === 2 ? 'text-secondary' : 'text-muted-foreground'
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

      {user?.isAnonymous && (
        <button
          onClick={() => navigate('/auth')}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-all"
        >
          <LogIn className="w-4 h-4" />
          {t('loginToSaveScore')}
        </button>
      )}
    </div>
  );
};

export default LeaderboardPanel;
