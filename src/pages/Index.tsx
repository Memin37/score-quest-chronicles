import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Clock, ChevronRight, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';

const gamesData = [
  {
    id: 'sudoku',
    nameKey: 'gameSudoku',
    descKey: 'gameSudokuDesc',
    icon: '🧩',
    path: '/sudoku',
  },
  {
    id: 'memory',
    nameKey: 'gameMemory',
    descKey: 'gameMemoryDesc',
    icon: '🃏',
    path: '/memory',
  },
  {
    id: 'blockpuzzle',
    nameKey: 'gameBlock',
    descKey: 'gameBlockDesc',
    icon: '🧱',
    path: '/blockpuzzle',
  },
  {
    id: 'maze',
    nameKey: 'gameMaze',
    descKey: 'gameMazeDesc',
    icon: '🏁',
    path: '/maze',
  },
];

const Index = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen bg-background grid-pattern flex items-center justify-center"><p className="text-muted-foreground">{t('loading')}</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  const isAnon = user.isAnonymous;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-xl text-primary neon-text cursor-pointer" onClick={() => navigate('/')}>{t('arena')}</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector />
            <button
              onClick={() => navigate('/settings')}
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary transition-colors"
              title={t('settings')}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => isAnon ? navigate('/auth') : navigate('/profile')}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-md text-foreground text-sm hover:bg-muted/80 transition-all"
            >
              <span className="hidden sm:inline">{user.name}</span>
              <span className="sm:hidden">{user.name.slice(0, 3)}..</span>
              {isAnon && <span className="text-xs text-muted-foreground">({t('guest')})</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h2 className="font-display text-sm sm:text-base text-foreground">{t('games')}</h2>
          </div>
          <p className="text-muted-foreground text-sm">{t('indexSubtitle')}</p>
        </div>

        <div className="grid gap-4 max-w-lg mx-auto">
          {gamesData.map(game => (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              className="bg-card border border-border rounded-lg p-6 text-left hover:border-primary/50 hover:neon-box transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{game.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{t(game.nameKey)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t(game.descKey)}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-accent">
                      <Trophy className="w-3 h-3" />
                      <span>{t('bestTime')}</span>
                      <span className="text-muted-foreground mx-1">•</span>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{t('weekly')}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-xs font-display">{t('moreGamesSoon')}</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
