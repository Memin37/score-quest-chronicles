import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  game: string;
  difficulty: string;
  score: number; // time in seconds for sudoku
  date: string;
}

interface GameContextType {
  entries: LeaderboardEntry[];
  addEntry: (entry: Omit<LeaderboardEntry, 'date'>) => void;
  getLeaderboard: (game: string, difficulty: string) => LeaderboardEntry[];
  getWeekStart: () => string;
  getBestScore: (userId: string, game: string, difficulty: string) => LeaderboardEntry | null;
}

const GameContext = createContext<GameContextType | null>(null);

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const weekStart = getWeekStart();
    const stored = JSON.parse(localStorage.getItem('leaderboard') || '[]') as LeaderboardEntry[];
    // Filter to current week only
    const currentWeek = stored.filter(e => e.date >= weekStart);
    if (currentWeek.length !== stored.length) {
      localStorage.setItem('leaderboard', JSON.stringify(currentWeek));
    }
    setEntries(currentWeek);
  }, []);

  const addEntry = (entry: Omit<LeaderboardEntry, 'date'>) => {
    const newEntry: LeaderboardEntry = { ...entry, date: new Date().toISOString() };
    const weekStart = getWeekStart();
    
    setEntries(prev => {
      // Keep only best score per user per game per difficulty this week
      const existing = prev.find(
        e => e.userId === entry.userId && e.game === entry.game && e.difficulty === entry.difficulty && e.date >= weekStart
      );
      
      let updated: LeaderboardEntry[];
      if (existing) {
        if (entry.score < existing.score) {
          updated = prev.map(e => 
            e === existing ? newEntry : e
          );
        } else {
          return prev;
        }
      } else {
        updated = [...prev, newEntry];
      }
      
      localStorage.setItem('leaderboard', JSON.stringify(updated));
      return updated;
    });
  };

  const getLeaderboard = (game: string, difficulty: string): LeaderboardEntry[] => {
    const weekStart = getWeekStart();
    return entries
      .filter(e => e.game === game && e.difficulty === difficulty && e.date >= weekStart)
      .sort((a, b) => a.score - b.score);
  };

  const getBestScore = (userId: string, game: string, difficulty: string): LeaderboardEntry | null => {
    const weekStart = getWeekStart();
    return entries.find(
      e => e.userId === userId && e.game === game && e.difficulty === difficulty && e.date >= weekStart
    ) || null;
  };

  return (
    <GameContext.Provider value={{ entries, addEntry, getLeaderboard, getWeekStart, getBestScore }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
};
