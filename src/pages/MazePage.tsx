import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { generateMaze, canMove, getMazeSize, formatTime, difficultyLabels, getTeleportTargets, type Difficulty, type Cell } from '@/lib/maze';
import LeaderboardPanel from '@/components/LeaderboardPanel';
import { Timer, RotateCcw, Trophy, User, LogOut, AlertTriangle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePendingScore } from '@/lib/pendingScore';

const PENALTY_SECONDS = 5;


interface PenaltyAnim {
  id: number;
  timestamp: number;
}

const MazePage = () => {
  const { user, loading, logout } = useAuth();
  const { addEntry } = useGame();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [maze, setMaze] = useState<Cell[][] | null>(null);
  const [playerPos, setPlayerPos] = useState<[number, number]>([0, 0]);
  const [goalPos, setGoalPos] = useState<[number, number]>([0, 0]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [penaltyAnims, setPenaltyAnims] = useState<PenaltyAnim[]>([]);
  const penaltyIdRef = useRef(0);
  const mazeRef = useRef<HTMLDivElement>(null);

  const [previewReady, setPreviewReady] = useState(false);

  const prepareMaze = useCallback((diff: Difficulty) => {
    const size = getMazeSize(diff);
    const m = generateMaze(size);
    setMaze(m);
    setPlayerPos([0, 0]);
    setGoalPos([size - 1, size - 1]);
    setTimer(0);
    setIsRunning(false);
    setIsComplete(false);
    setGameStarted(false);
    setPreviewReady(true);
    setMistakeCount(0);
    setPenaltyAnims([]);
    setDifficulty(diff);
  }, []);

  const handleStartGame = useCallback(() => {
    setGameStarted(true);
    setIsRunning(true);
    setTimeout(() => mazeRef.current?.focus(), 50);
  }, []);

  const startNewGame = useCallback((diff: Difficulty) => {
    const size = getMazeSize(diff);
    const m = generateMaze(size);
    setMaze(m);
    setPlayerPos([0, 0]);
    setGoalPos([size - 1, size - 1]);
    setTimer(0);
    setIsRunning(true);
    setIsComplete(false);
    setGameStarted(true);
    setPreviewReady(false);
    setMistakeCount(0);
    setPenaltyAnims([]);
    setDifficulty(diff);
    setTimeout(() => mazeRef.current?.focus(), 50);
  }, []);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const completeGame = useCallback(() => {
    setIsComplete(true);
    setIsRunning(false);
  }, []);

  // Save score on complete
  useEffect(() => {
    if (!isComplete || !user || user.isAnonymous || !maze) return;
    const finalTime = timer + mistakeCount * PENALTY_SECONDS;
    addEntry({ userId: user.id, userName: user.name, game: 'maze', difficulty, score: finalTime });
  }, [isComplete]);

  const addPenalty = useCallback(() => {
    setMistakeCount(c => c + 1);
    const id = ++penaltyIdRef.current;
    setPenaltyAnims(prev => [...prev, { id, timestamp: Date.now() }]);
    setTimeout(() => setPenaltyAnims(prev => prev.filter(p => p.id !== id)), 1200);
  }, []);

  const movePlayer = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (!maze || isComplete) return;
    const [r, c] = playerPos;
    if (canMove(maze, r, c, dir)) {
      const delta: Record<string, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
      const [dr, dc] = delta[dir];
      const newPos: [number, number] = [r + dr, c + dc];
      setPlayerPos(newPos);
      // Immediate win check
      if (newPos[0] === goalPos[0] && newPos[1] === goalPos[1]) {
        completeGame();
      }
    } else {
      addPenalty();
    }
  }, [maze, playerPos, isComplete, addPenalty, goalPos, completeGame]);

  // Teleport targets: intersection/corner points reachable in straight lines
  const teleportTargets = useMemo(() => {
    if (!maze || isComplete || !gameStarted) return [];
    return getTeleportTargets(maze, playerPos, goalPos);
  }, [maze, playerPos, isComplete, gameStarted]);

  const teleportSet = useMemo(() => {
    const s = new Set<string>();
    teleportTargets.forEach(([r, c]) => s.add(`${r},${c}`));
    return s;
  }, [teleportTargets]);

  // Click-to-teleport: only to valid teleport targets
  const handleCellClick = useCallback((r: number, c: number) => {
    if (!maze || isComplete || !gameStarted) return;
    if (r === playerPos[0] && c === playerPos[1]) return;
    if (!teleportSet.has(`${r},${c}`)) return;
    const newPos: [number, number] = [r, c];
    setPlayerPos(newPos);
    if (newPos[0] === goalPos[0] && newPos[1] === goalPos[1]) {
      completeGame();
    }
  }, [maze, playerPos, isComplete, gameStarted, goalPos, completeGame, teleportSet]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent | KeyboardEvent) => {
    const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right',
    };
    const dir = keyMap[e.key];
    if (dir) { e.preventDefault(); movePlayer(dir); }
  }, [movePlayer]);

  const handleSaveScore = () => {
    if (!user) return;
    const finalTime = timer + mistakeCount * PENALTY_SECONDS;
    if (user.isAnonymous) {
      savePendingScore({ game: 'maze', difficulty, score: finalTime, returnPath: '/maze' });
      navigate('/auth');
    }
  };


  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Yükleniyor...</p></div>;
  if (!user) { navigate('/auth'); return null; }

  const finalTime = timer + mistakeCount * PENALTY_SECONDS;
  const size = maze ? maze.length : getMazeSize(difficulty);
  const cellPx = Math.min(Math.floor(500 / size), 40);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="font-display text-lg text-primary neon-text hover:opacity-80">ARENA</button>
          <h2 className="font-display text-sm text-foreground">LABİRENT</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="p-2 text-muted-foreground hover:text-primary"><Trophy className="w-5 h-5" /></button>
            <button onClick={() => navigate('/profile')} className="p-2 text-muted-foreground hover:text-primary"><User className="w-5 h-5" /></button>
            <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          {!previewReady && !gameStarted && (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
              <h2 className="font-display text-lg text-foreground">ZORLUK SEVİYESİ SEÇ</h2>
              <div className="flex gap-3">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button key={d} onClick={() => prepareMaze(d)}
                    className="px-6 py-3 bg-card border border-border rounded-lg text-foreground hover:border-primary hover:neon-box transition-all font-display text-sm">
                    {difficultyLabels[d]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(previewReady || gameStarted) && maze && (
            <div className="flex flex-col items-center gap-4">
              {/* Controls bar */}
              {gameStarted && (
                <div className="flex items-center gap-4 w-full max-w-lg justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm font-mono">
                      <Timer className="w-4 h-4 text-primary" />
                      <span className="text-foreground">{formatTime(timer)}</span>
                    </div>
                    {mistakeCount > 0 && (
                      <div className="relative flex items-center gap-1 text-sm">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-destructive font-mono">+{mistakeCount * PENALTY_SECONDS}s</span>
                        {penaltyAnims.map(p => (
                          <span key={p.id} className="absolute -top-4 right-0 text-xs text-destructive font-bold animate-bounce">+{PENALTY_SECONDS}s</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-display">{difficultyLabels[difficulty]}</span>
                    <button onClick={() => startNewGame(difficulty)} className="p-1.5 text-muted-foreground hover:text-primary"><RotateCcw className="w-4 h-4" /></button>
                  </div>
                </div>
              )}

              {/* Maze grid with blur overlay */}
              <div className="relative">
                <div
                  ref={mazeRef}
                  tabIndex={0}
                  onKeyDown={handleKeyDown}
                  className={`outline-none relative bg-card border border-border rounded-lg p-2 overflow-hidden ${!gameStarted ? 'blur-md pointer-events-none select-none' : ''}`}
                  style={{ width: cellPx * size + 16, height: cellPx * size + 16 }}
                >
                  {maze.map((row, r) =>
                    row.map((cell, c) => {
                      const isPlayer = r === playerPos[0] && c === playerPos[1];
                      const isGoal = r === goalPos[0] && c === goalPos[1];
                      const isTeleportTarget = gameStarted && teleportSet.has(`${r},${c}`);

                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`absolute transition-opacity duration-300 ${gameStarted ? 'cursor-pointer' : ''}`}
                          onClick={() => handleCellClick(r, c)}
                          style={{
                            left: c * cellPx,
                            top: r * cellPx,
                            width: cellPx,
                            height: cellPx,
                            borderTop: cell.top ? '2px solid hsl(var(--primary))' : 'none',
                            borderRight: cell.right ? '2px solid hsl(var(--primary))' : 'none',
                            borderBottom: cell.bottom ? '2px solid hsl(var(--primary))' : 'none',
                            borderLeft: cell.left ? '2px solid hsl(var(--primary))' : 'none',
                          }}
                        >
                          {isGoal && (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                              <div className="w-3/5 h-3/5 rounded-sm bg-accent animate-pulse" />
                            </div>
                          )}
                          {isPlayer && (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                              <div className="w-3/5 h-3/5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                            </div>
                          )}
                          {isTeleportTarget && !isPlayer && (
                            <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                              <div className="w-2/5 h-2/5 rounded-full border-2 border-primary/50 bg-primary/15 animate-pulse" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {/* BAŞLA overlay */}
                {previewReady && !gameStarted && (
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

              {/* Mobile controls */}
              {gameStarted && (
              <div className="flex flex-col items-center gap-1 lg:hidden mt-2">
                <button onClick={() => movePlayer('up')} className="p-3 bg-card border border-border rounded-lg hover:border-primary active:bg-primary/20">
                  <ArrowUp className="w-6 h-6 text-foreground" />
                </button>
                <div className="flex gap-1">
                  <button onClick={() => movePlayer('left')} className="p-3 bg-card border border-border rounded-lg hover:border-primary active:bg-primary/20">
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                  </button>
                  <button onClick={() => movePlayer('down')} className="p-3 bg-card border border-border rounded-lg hover:border-primary active:bg-primary/20">
                    <ArrowDown className="w-6 h-6 text-foreground" />
                  </button>
                  <button onClick={() => movePlayer('right')} className="p-3 bg-card border border-border rounded-lg hover:border-primary active:bg-primary/20">
                    <ArrowRight className="w-6 h-6 text-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Parlayan noktalara tıklayarak ışınlan</p>
              </div>
              )}

              {/* Win modal */}
              {isComplete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                  <div className="bg-card border border-primary/50 rounded-xl p-8 max-w-sm w-full mx-4 text-center neon-box">
                    <h3 className="font-display text-lg text-primary neon-text mb-2">TEBRİKLER!</h3>
                    <p className="text-muted-foreground text-sm mb-4">Labirenti tamamladın!</p>
                    <div className="bg-muted rounded-lg p-4 mb-4">
                      <p className="text-xs text-muted-foreground">Toplam Süre</p>
                      <p className="text-2xl font-mono text-foreground">{formatTime(finalTime)}</p>
                      {mistakeCount > 0 && (
                        <p className="text-xs text-destructive mt-1">({mistakeCount} ceza × {PENALTY_SECONDS}s = +{mistakeCount * PENALTY_SECONDS}s)</p>
                      )}
                    </div>
                    {user.isAnonymous ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Skorunu kaydetmek için giriş yap!</p>
                        <button onClick={handleSaveScore} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-display text-sm hover:bg-primary/90">
                          Giriş Yap & Kaydet
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-accent">✓ Skorun kaydedildi!</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => startNewGame(difficulty)} className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80">
                        Tekrar Oyna
                      </button>
                      <button onClick={() => { setGameStarted(false); setPreviewReady(false); setMaze(null); }} className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg text-sm hover:bg-muted/80">
                        Zorluk Değiştir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`${showLeaderboard ? 'block' : 'hidden'} lg:block w-full lg:w-80`}>
          <LeaderboardPanel game="maze" difficulty={difficulty} />
        </div>
      </div>
    </div>
  );
};

export default MazePage;
