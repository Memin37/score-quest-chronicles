import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { generateMemoryCards, getGridConfig, formatTime, type MemoryCard as MemoryCardType, type MemoryDifficulty } from '@/lib/memory';
import MemoryCardComponent from '@/components/MemoryCard';
import LeaderboardPanel from '@/components/LeaderboardPanel';
import AdBanner from '@/components/AdBanner';
import { Timer, RotateCcw, Trophy, User, LogOut, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import { savePendingScore } from '@/lib/pendingScore';

const difficultyLabels: Record<MemoryDifficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

const MemoryPage = () => {
  const { user, loading, logout } = useAuth();
  const { addEntry } = useGame();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [difficulty, setDifficulty] = useState<MemoryDifficulty>('easy');
  const [cards, setCards] = useState<MemoryCardType[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [moves, setMoves] = useState(0);

  const startNewGame = useCallback((diff: MemoryDifficulty) => {
    setCards(generateMemoryCards(diff));
    setFlippedIds([]);
    setTimer(0);
    setIsRunning(false);
    setIsComplete(false);
    setGameStarted(false);
    setMoves(0);
  }, []);

  useEffect(() => { startNewGame(difficulty); }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTimer(t => t + 10), 10);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user]);

  const handleStartGame = () => {
    setGameStarted(true);
    setIsRunning(true);
  };

  const handleCardClick = (id: number) => {
    if (!gameStarted || isComplete || flippedIds.length >= 2) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    const newCards = cards.map(c => c.id === id ? { ...c, isFlipped: true } : c);
    const newFlipped = [...flippedIds, id];
    setCards(newCards);
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped.map(fid => newCards.find(c => c.id === fid)!);

      if (first.emoji === second.emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map(c =>
              c.id === first.id || c.id === second.id
                ? { ...c, isMatched: true, isFlipped: false }
                : c
            );
            // Check completion
            if (updated.every(c => c.isMatched)) {
              setIsRunning(false);
              setIsComplete(true);
              if (user && !user.isAnonymous) {
                addEntry({
                  userId: user.id,
                  userName: user.name,
                  game: 'memory',
                  difficulty,
                  score: timer,
                });
              }
            }
            return updated;
          });
          setFlippedIds([]);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === first.id || c.id === second.id
              ? { ...c, isFlipped: false }
              : c
          ));
          setFlippedIds([]);
        }, 800);
      }
    }
  };

  const gridConfig = getGridConfig(difficulty);

  if (loading) return <div className="min-h-screen bg-background grid-pattern flex items-center justify-center"><p className="text-muted-foreground">{t('loading')}</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg text-primary neon-text cursor-pointer" onClick={() => navigate('/')}>{t('arena')}</h1>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-md text-accent text-sm hover:bg-accent/20 transition-all sm:hidden">
              <Trophy className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/profile')} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-md text-foreground text-sm hover:bg-muted/80 transition-all">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
            <button onClick={async () => { await logout(); navigate('/auth'); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title={t('logout')}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="w-full px-4 py-6">
        <div className="flex justify-center gap-6">
          {/* Left Ad */}
          <div className="hidden xl:block w-40 shrink-0 sticky top-20 self-start">
            <AdBanner adSlot="LEFT_AD_SLOT" format="vertical" />
          </div>

          {/* Game content */}
          <div className="flex-1 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              {(Object.keys(difficultyLabels) as MemoryDifficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); startNewGame(d); }}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    difficulty === d
                      ? 'bg-primary text-primary-foreground neon-box'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                >
                  {t(d)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-md border border-border">
                <Timer className="w-4 h-4 text-primary" />
                <span className="font-mono text-lg text-foreground font-bold">{formatTime(timer)}</span>
              </div>
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border border-border text-sm text-muted-foreground">
                <span>{t('moves')}: <span className="text-foreground font-bold">{moves}</span></span>
              </div>
              <button
                onClick={() => startNewGame(difficulty)}
                className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border rounded-md text-muted-foreground hover:text-foreground transition-all text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                {t('newGame')}
              </button>
            </div>

            {isComplete && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg neon-box">
                <p className="font-display text-xs text-primary neon-text">{t('congrats')}</p>
                <p className="text-foreground text-sm mt-1">
                  {t('time')}: <span className="font-mono font-bold text-primary">{formatTime(timer)}</span>
                  {' • '}{t('moves')}: <span className="font-mono font-bold text-primary">{moves}</span>
                </p>
                {user?.isAnonymous && (
                  <button
                    onClick={() => {
                      savePendingScore({ game: 'memory', difficulty, score: timer, returnPath: '/memory' });
                      navigate('/auth');
                    }}
                    className="mt-2 text-xs text-accent underline hover:text-accent/80 transition-colors"
                  >
                    {t('saveScoreToLogin')}
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <div className={!gameStarted ? 'blur-md pointer-events-none select-none' : ''}>
                <div
                  className="grid gap-2 sm:gap-3 max-w-md mx-auto"
                  style={{ gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)` }}
                >
                  {cards.map(card => (
                    <MemoryCardComponent
                      key={card.id}
                      card={card}
                      onClick={() => handleCardClick(card.id)}
                      disabled={flippedIds.length >= 2}
                    />
                  ))}
                </div>
              </div>
              {!gameStarted && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <button
                    onClick={handleStartGame}
                    className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-display text-sm rounded-lg neon-box-strong hover:scale-105 transition-transform"
                  >
                    <Play className="w-5 h-5" />
                    {t('start')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Leaderboard + Ad */}
          <div className="hidden lg:flex flex-col w-80 shrink-0 gap-6">
            <LeaderboardPanel game="memory" difficulty={difficulty} />
            <AdBanner adSlot="RIGHT_AD_SLOT" format="vertical" />
          </div>

          {showLeaderboard && (
            <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm lg:hidden p-4 overflow-auto">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display text-sm text-accent">{t('leaderboardTitle')}</h2>
                  <button onClick={() => setShowLeaderboard(false)} className="text-muted-foreground hover:text-foreground text-2xl">{t('close')}</button>
                </div>
                <LeaderboardPanel game="memory" difficulty={difficulty} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryPage;
