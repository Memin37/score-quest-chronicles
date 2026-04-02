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
  allTimeEntries: LeaderboardEntry[];
  addEntry: (entry: Omit<LeaderboardEntry, 'weekStart'>) => Promise<void>;
  getLeaderboard: (game: string, difficulty: string) => LeaderboardEntry[];
  getAllTimeLeaderboard: (game: string, difficulty: string) => LeaderboardEntry[];
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
  const [allTimeEntries, setAllTimeEntries] = useState<LeaderboardEntry[]>([]);

  const mapEntries = (data: any[]): LeaderboardEntry[] =>
    data.map(d => ({
      userId: d.user_id,
      userName: d.user_name,
      game: d.game,
      difficulty: d.difficulty,
      score: d.score,
      weekStart: d.week_start,
    }));

  const fetchEntries = async () => {
    const weekStart = getWeekStart();
    const [weeklyRes, allTimeRes] = await Promise.all([
      supabase
        .from('leaderboard_entries')
        .select('*')
        .eq('week_start', weekStart)
        .order('score', { ascending: true }),
      supabase
        .from('leaderboard_entries')
        .select('*')
        .order('score', { ascending: true })
        .limit(100),
    ]);

    if (weeklyRes.data) setEntries(mapEntries(weeklyRes.data));
    if (allTimeRes.data) {
      // Keep only the best score per user/game/difficulty
      const best = new Map<string, LeaderboardEntry>();
      for (const entry of mapEntries(allTimeRes.data)) {
        const key = `${entry.userId}-${entry.game}-${entry.difficulty}`;
        const existing = best.get(key);
        if (!existing || entry.score < existing.score) {
          best.set(key, entry);
        }
      }
      setAllTimeEntries(Array.from(best.values()).sort((a, b) => a.score - b.score));
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const addEntry = async (entry: Omit<LeaderboardEntry, 'weekStart'>) => {
    const weekStart = getWeekStart();

    // Upsert: insert or update if better score
    const { data: existing, error: fetchError } = await supabase
      .from('leaderboard_entries')
      .select('*')
      .eq('user_id', entry.userId)
      .eq('game', entry.game)
      .eq('difficulty', entry.difficulty)
      .eq('week_start', weekStart)
      .maybeSingle();

    if (fetchError) {
      console.error('Leaderboard fetch error:', fetchError);
    }

    if (existing) {
      if (entry.score < existing.score) {
        const { error: updateError } = await supabase
          .from('leaderboard_entries')
          .update({ score: entry.score, user_name: entry.userName })
          .eq('id', existing.id);
        if (updateError) console.error('Leaderboard update error:', updateError);
      }
    } else {
      const { error: insertError } = await supabase.from('leaderboard_entries').insert({
        user_id: entry.userId,
        user_name: entry.userName,
        game: entry.game,
        difficulty: entry.difficulty,
        score: entry.score,
        week_start: weekStart,
      });
      if (insertError) console.error('Leaderboard insert error:', insertError);
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
