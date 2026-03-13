import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { generateSudoku, checkComplete, formatTime } from '@/lib/sudoku';
import SudokuBoard from '@/components/SudokuBoard';
import NumberPad from '@/components/NumberPad';
import LeaderboardPanel from '@/components/LeaderboardPanel';
import { Timer, RotateCcw, Trophy, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Difficulty = 'easy' | 'medium' | 'hard';

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

const SudokuPage = () => {
  const { user, loading, logout } = useAuth();
  const { addEntry } = useGame();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [puzzle, setPuzzle] = useState<(number | null)[][]>([]);
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [solution, setSolution] = useState<(number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const startNewGame = useCallback((diff: Difficulty) => {
    const { puzzle: p, solution: s } = generateSudoku(diff);
    setPuzzle(p.map(r => [...r]));
    setBoard(p.map(r => [...r]));
    setSolution(s);
    setSelectedCell(null);
    setTimer(0);
    setIsRunning(true);
    setIsComplete(false);
    setErrors(new Set());
  }, []);

  useEffect(() => {
    startNewGame(difficulty);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [loading, user]);

  const handleCellClick = (row: number, col: number) => {
    if (isComplete) return;
    if (puzzle[row]?.[col] !== null) return;
    setSelectedCell([row, col]);
  };

  const handleNumber = (num: number) => {
    if (!selectedCell || isComplete) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== null) return;

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    const newErrors = new Set(errors);
    if (num !== solution[r][c]) {
      newErrors.add(`${r}-${c}`);
    } else {
      newErrors.delete(`${r}-${c}`);
    }
    setErrors(newErrors);

    if (newErrors.size === 0 && checkComplete(newBoard)) {
      setIsRunning(false);
      setIsComplete(true);
      if (user) {
        addEntry({
          userId: user.id,
          userName: user.name,
          game: 'sudoku',
          difficulty,
          score: timer,
        });
      }
    }
  };

  const handleClear = () => {
    if (!selectedCell || isComplete) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== null) return;
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = null;
    setBoard(newBoard);
    const newErrors = new Set(errors);
    newErrors.delete(`${r}-${c}`);
    setErrors(newErrors);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell || isComplete) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      handleNumber(num);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleClear();
    }
  }, [selectedCell, isComplete, board, puzzle, solution, errors, timer, user]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) return <div className="min-h-screen bg-background grid-pattern flex items-center justify-center"><p className="text-muted-foreground">Yükleniyor...</p></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg text-primary neon-text cursor-pointer" onClick={() => navigate('/')}>
            ARENA
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeaderboard(!showLeaderboard)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-md text-accent text-sm hover:bg-accent/20 transition-all sm:hidden"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-md text-foreground text-sm hover:bg-muted/80 transition-all"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
            <button
              onClick={async () => { await logout(); navigate('/auth'); }}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              title="Çıkış"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6">
              {(Object.keys(difficultyLabels) as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); startNewGame(d); }}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                    difficulty === d
                      ? 'bg-primary text-primary-foreground neon-box'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
                >
                  {difficultyLabels[d]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-md border border-border">
                <Timer className="w-4 h-4 text-primary" />
                <span className="font-mono text-lg text-foreground font-bold">
                  {formatTime(timer)}
                </span>
              </div>
              <button
                onClick={() => startNewGame(difficulty)}
                className="flex items-center gap-1.5 px-3 py-2 bg-muted border border-border rounded-md text-muted-foreground hover:text-foreground transition-all text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Yeni Oyun
              </button>
            </div>

            {isComplete && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg neon-box">
                <p className="font-display text-xs text-primary neon-text">TEBRİKLER! 🎉</p>
                <p className="text-foreground text-sm mt-1">
                  Süreniz: <span className="font-mono font-bold text-primary">{formatTime(timer)}</span>
                </p>
              </div>
            )}

            {puzzle.length > 0 && (
              <div className="flex flex-col items-center sm:items-start gap-6">
                <SudokuBoard board={board} puzzle={puzzle} selectedCell={selectedCell} onCellClick={handleCellClick} errors={errors} />
                <NumberPad onNumber={handleNumber} onClear={handleClear} />
              </div>
            )}
          </div>

          <div className="hidden lg:block w-80">
            <LeaderboardPanel game="sudoku" difficulty={difficulty} />
          </div>

          {showLeaderboard && (
            <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm lg:hidden p-4 overflow-auto">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display text-sm text-accent">SKOR TABLOSU</h2>
                  <button onClick={() => setShowLeaderboard(false)} className="text-muted-foreground hover:text-foreground text-2xl">×</button>
                </div>
                <LeaderboardPanel game="sudoku" difficulty={difficulty} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SudokuPage;
