import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Gamepad2, Trophy, Clock, ChevronRight } from 'lucide-react';

const games = [
  {
    id: 'sudoku',
    name: 'Sudoku',
    description: 'Klasik sayı bulmacası. En hızlı süreyi yakala!',
    icon: '🧩',
    path: '/sudoku',
    scoreType: 'En İyi Süre',
  },
  {
    id: 'memory',
    name: 'Hafıza Kartları',
    description: 'Eşleşen kartları bul, süreye karşı yarış!',
    icon: '🃏',
    path: '/memory',
    scoreType: 'En İyi Süre',
  },
  {
    id: 'blockpuzzle',
    name: 'Blok Bulmaca',
    description: 'Tetris parçalarını sürükleyip alanı tamamen doldur!',
    icon: '🧱',
    path: '/blockpuzzle',
    scoreType: 'En İyi Süre',
  },
];

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen bg-background grid-pattern flex items-center justify-center"><p className="text-muted-foreground">Yükleniyor...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  const isAnon = user.isAnonymous;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display text-xl text-primary neon-text">ARENA</h1>
          <button
            onClick={() => isAnon ? navigate('/auth') : navigate('/profile')}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-md text-foreground text-sm hover:bg-muted/80 transition-all"
          >
            <span>{user.name}</span>
            {isAnon && <span className="text-xs text-muted-foreground">(Misafir)</span>}
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            <h2 className="font-display text-sm sm:text-base text-foreground">OYUNLAR</h2>
          </div>
          <p className="text-muted-foreground text-sm">Her hafta sıfırlanan skor tablosu ile yarış!</p>
        </div>

        <div className="grid gap-4 max-w-lg mx-auto">
          {games.map(game => (
            <button
              key={game.id}
              onClick={() => navigate(game.path)}
              className="bg-card border border-border rounded-lg p-6 text-left hover:border-primary/50 hover:neon-box transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{game.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{game.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-accent">
                      <Trophy className="w-3 h-3" />
                      <span>{game.scoreType}</span>
                      <span className="text-muted-foreground mx-1">•</span>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Haftalık</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground text-xs font-display">DAHA FAZLA OYUN YAKINDA...</p>
        </div>
      </main>
    </div>
  );
};

export default Index;
