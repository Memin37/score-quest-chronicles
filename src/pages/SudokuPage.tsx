import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { generateSudoku, checkComplete, formatTime } from '@/lib/sudoku';
import SudokuBoard from '@/components/SudokuBoard';
import NumberPad from '@/components/NumberPad';
import LeaderboardPanel from '@/components/LeaderboardPanel';
import { Timer, RotateCcw, Trophy, User, LogOut, Play } from 'lucide-react';
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
  const [gameStarted, setGameStarted] = useState(false);
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Map<string, Set<number>>>(new Map());

  const startNewGame = useCallback((diff: Difficulty) => {
    const { puzzle: p, solution: s } = generateSudoku(diff);
    setPuzzle(p.map(r => [...r]));
    setBoard(p.map(r => [...r]));
    setSolution(s);
    setSelectedCell(null);
    setTimer(0);
    setIsRunning(false);
    setIsComplete(false);
    setErrors(new Set());
    setGameStarted(false);
    setNotesMode(false);
    setNotes(new Map());
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
    if (!loading && !user) navigate('/');
  }, [loading, user]);

  const handleStartGame = () => {
    setGameStarted(true);
    setIsRunning(true);
  };

  // Determine highlighted number from selected cell
  const highlightedNumber = selectedCell ? board[selectedCell[0]][selectedCell[1]] : null;

  // Find numbers that are fully and correctly placed (all 9 instances with no conflicts)
  const completedNumbers = React.useMemo(() => {
    const completed = new Set<number>();
    for (let num = 1; num <= 9; num++) {
      let count = 0;
      let hasConflict = false;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r]?.[c] === num) {
            count++;
            if (errors.has(`${r}-${c}`)) hasConflict = true;
          }
        }
      }
      if (count === 9 && !hasConflict) completed.add(num);
    }
    return completed;
  }, [board, errors]);

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted || isComplete) return;
    setSelectedCell([row, col]);
  };

  const findConflicts = useCallback((currentBoard: (number | null)[][]) => {
    const conflicts = new Set<string>();
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = currentBoard[r][c];
        if (val === null) continue;
        // Check row
        for (let cc = 0; cc < 9; cc++) {
          if (cc !== c && currentBoard[r][cc] === val) {
            conflicts.add(`${r}-${c}`);
            conflicts.add(`${r}-${cc}`);
          }
        }
        // Check col
        for (let rr = 0; rr < 9; rr++) {
          if (rr !== r && currentBoard[rr][c] === val) {
            conflicts.add(`${r}-${c}`);
            conflicts.add(`${rr}-${c}`);
          }
        }
        // Check box
        const br = Math.floor(r / 3) * 3;
        const bc = Math.floor(c / 3) * 3;
        for (let rr = br; rr < br + 3; rr++) {
          for (let cc = bc; cc < bc + 3; cc++) {
            if ((rr !== r || cc !== c) && currentBoard[rr][cc] === val) {
              conflicts.add(`${r}-${c}`);
              conflicts.add(`${rr}-${cc}`);
            }
          }
        }
      }
    }
    return conflicts;
  }, []);

  const handleNumber = (num: number) => {
    if (!selectedCell || isComplete || !gameStarted) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== null) return;

    if (notesMode) {
      const key = `${r}-${c}`;
      const newNotes = new Map(notes);
      const cellNotes = new Set(newNotes.get(key) || []);
      if (cellNotes.has(num)) {
        cellNotes.delete(num);
      } else {
        cellNotes.add(num);
      }
      newNotes.set(key, cellNotes);
      setNotes(newNotes);
      return;
    }

    // Clear notes for this cell when placing a number
    const newNotes = new Map(notes);
    newNotes.delete(`${r}-${c}`);
    setNotes(newNotes);

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = num;
    setBoard(newBoard);

    const newErrors = findConflicts(newBoard);
    setErrors(newErrors);

    if (newErrors.size === 0 && checkComplete(newBoard)) {
      setIsRunning(false);
      setIsComplete(true);
      if (user && !user.isAnonymous) {
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
    if (!selectedCell || isComplete || !gameStarted) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== null) return;

    const newNotes = new Map(notes);
    newNotes.delete(`${r}-${c}`);
    setNotes(newNotes);

    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = null;
    setBoard(newBoard);
    setErrors(findConflicts(newBoard));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell || isComplete || !gameStarted) return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
      handleNumber(num);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      handleClear();
    } else if (e.key === 'n' || e.key === 'N') {
      setNotesMode(m => !m);
    }
  }, [selectedCell, isComplete, gameStarted, board, puzzle, solution, errors, timer, user, notesMode, notes]);

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
                <div className="relative">
                  <div className={!gameStarted ? 'blur-md pointer-events-none select-none' : ''}>
                    <SudokuBoard
                      board={board}
                      puzzle={puzzle}
                      selectedCell={selectedCell}
                      onCellClick={handleCellClick}
                      errors={errors}
                      notes={notes}
                      highlightedNumber={highlightedNumber}
                    />
                  </div>
                  {!gameStarted && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <button
                        onClick={handleStartGame}
                        className="flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-display text-sm rounded-lg neon-box-strong hover:scale-105 transition-transform"
                      >
                        <Play className="w-5 h-5" />
                        BAŞLA
                      </button>
                    </div>
                  )}
                </div>
                {gameStarted && (
                  <NumberPad
                    onNumber={handleNumber}
                    onClear={handleClear}
                    notesMode={notesMode}
                    onToggleNotes={() => setNotesMode(m => !m)}
                    completedNumbers={completedNumbers}
                  />
                )}
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
