import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  game: string;
  difficulty: string;
  score: number;
  weekStart: string;
}

interface GameContextType {
  entries: LeaderboardEntry[];
  addEntry: (entry: Omit<LeaderboardEntry, 'weekStart'>) => Promise<void>;
  getLeaderboard: (game: string, difficulty: string) => LeaderboardEntry[];
  getWeekStart: () => string;
}

const GameContext = createContext<GameContextType | null>(null);

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split('T')[0];
};

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  const fetchEntries = async () => {
    const weekStart = getWeekStart();
    const { data } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('week_start', weekStart)
      .order('score', { ascending: true });

    if (data) {
      setEntries(data.map(d => ({
        userId: d.user_id,
        userName: d.user_name,
        game: d.game,
        difficulty: d.difficulty,
        score: d.score,
        weekStart: d.week_start,
      })));
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const addEntry = async (entry: Omit<LeaderboardEntry, 'weekStart'>) => {
    const weekStart = getWeekStart();

    // Upsert: insert or update if better score
    const { data: existing } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('user_id', entry.userId)
      .eq('game', entry.game)
      .eq('difficulty', entry.difficulty)
      .eq('week_start', weekStart)
      .single();

    if (existing) {
      if (entry.score < existing.score) {
        await supabase
          .from('leaderboard_entries')
          .update({ score: entry.score, user_name: entry.userName })
          .eq('id', existing.id);
      }
    } else {
      await supabase.from('leaderboard_entries').insert({
        user_id: entry.userId,
        user_name: entry.userName,
        game: entry.game,
        difficulty: entry.difficulty,
        score: entry.score,
        week_start: weekStart,
      });
    }

    await fetchEntries();
  };

  const getLeaderboard = (game: string, difficulty: string): LeaderboardEntry[] => {
    return entries
      .filter(e => e.game === game && e.difficulty === difficulty)
      .sort((a, b) => a.score - b.score);
  };

  return (
    <GameContext.Provider value={{ entries, addEntry, getLeaderboard, getWeekStart }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be inside GameProvider');
  return ctx;
};
