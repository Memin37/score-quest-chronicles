import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { formatTime } from '@/lib/sudoku';
import {
  generatePuzzle,
  canPlaceOnGrid,
  placePieceOnGrid,
  isGridComplete,
  createEmptyGrid,
  GRID_SIZES,
  type BlockDifficulty,
  type PieceShape,
} from '@/lib/blockPuzzle';
import LeaderboardPanel from '@/components/LeaderboardPanel';
import AdBanner from '@/components/AdBanner';
import { Timer, RotateCcw, Trophy, User, LogOut, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { savePendingScore } from '@/lib/pendingScore';

const difficultyLabels: Record<BlockDifficulty, string> = {
  easy: 'Kolay (4×4)',
  medium: 'Orta (5×5)',
  hard: 'Zor (6×6)',
};

// Ghost cell size is now dynamic, matching grid cell size
const LONG_PRESS_MS = 400;

const BlockPuzzlePage = () => {
  const { user, loading, logout } = useAuth();
  const { addEntry } = useGame();
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<BlockDifficulty>('easy');
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [pieces, setPieces] = useState<PieceShape[]>([]);
  const [gridSize, setGridSize] = useState(4);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState<PieceShape | null>(null);
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Track which piece occupies each cell for repositioning
  const [pieceIdGrid, setPieceIdGrid] = useState<(string | null)[][]>([]);
  const placedPiecesRef = useRef<Map<string, PieceShape>>(new Map());

  // Long press state
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressActiveRef = useRef(false);

  const startNewGame = useCallback((diff: BlockDifficulty) => {
    const { pieces: newPieces, gridSize: size } = generatePuzzle(diff);
    setGrid(createEmptyGrid(size));
    setPieceIdGrid(createEmptyGrid(size) as (string | null)[][]);
    setPieces(newPieces);
    setGridSize(size);
    setTimer(0);
    setIsRunning(false);
    setIsComplete(false);
    setGameStarted(false);
    setDraggedPiece(null);
    setHoverCell(null);
    placedPiecesRef.current = new Map();
  }, []);

  useEffect(() => { startNewGame(difficulty); }, []);

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

  // --- Place a piece and track it ---
  const placeAndTrack = (piece: PieceShape, row: number, col: number) => {
    const newGrid = placePieceOnGrid(grid, piece, row, col);
    setGrid(newGrid);

    const newIdGrid = pieceIdGrid.map(r => [...r]);
    piece.cells.forEach(([dr, dc]) => {
      newIdGrid[row + dr][col + dc] = piece.id;
    });
    setPieceIdGrid(newIdGrid);

    placedPiecesRef.current.set(piece.id, piece);
    setPieces(prev => prev.filter(p => p.id !== piece.id));

    if (isGridComplete(newGrid)) {
      setIsRunning(false);
      setIsComplete(true);
      if (user && !user.isAnonymous) {
        addEntry({
          userId: user.id,
          userName: user.name,
          game: 'blockpuzzle',
          difficulty,
          score: timer,
        });
      }
    }
  };

  // --- Remove a placed piece from grid ---
  const removePieceFromGrid = (pieceId: string): PieceShape | null => {
    const piece = placedPiecesRef.current.get(pieceId);
    if (!piece) return null;

    // Find where it was placed by scanning pieceIdGrid
    const newGrid = grid.map(r => [...r]);
    const newIdGrid = pieceIdGrid.map(r => [...r]);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newIdGrid[r][c] === pieceId) {
          newGrid[r][c] = null;
          newIdGrid[r][c] = null;
        }
      }
    }
    setGrid(newGrid);
    setPieceIdGrid(newIdGrid);
    placedPiecesRef.current.delete(pieceId);
    return piece;
  };

  // --- Drag from tray ---
  const handleDragStart = (piece: PieceShape, e: React.DragEvent) => {
    if (!gameStarted || isComplete) return;
    setDraggedPiece(piece);
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const getCellFromEvent = (e: React.DragEvent): [number, number] | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const cellSize = rect.width / gridSize;
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) return [row, col];
    return null;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    setHoverCell(cell);
    setFloatingPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setFloatingPos(null);
    setDraggedPiece(null);
    setHoverCell(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell || !draggedPiece) {
      setHoverCell(null);
      setDraggedPiece(null);
      return;
    }

    const [row, col] = cell;
    if (canPlaceOnGrid(grid, draggedPiece, row, col, gridSize)) {
      placeAndTrack(draggedPiece, row, col);
    }

    setHoverCell(null);
    setDraggedPiece(null);
    setFloatingPos(null);
  };

  // --- Touch support ---
  const touchPieceRef = useRef<PieceShape | null>(null);

  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (touchPieceRef.current) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, []);

  // PC: track mouse movement when carrying a piece (picked up via left-click)
  useEffect(() => {
    if (!draggedPiece || isTouchDevice()) return;

    const handleMouseMove = (e: MouseEvent) => {
      setFloatingPos({ x: e.clientX, y: e.clientY });
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        const cellSize = rect.width / gridSize;
        const col = Math.floor((e.clientX - rect.left) / cellSize);
        const row = Math.floor((e.clientY - rect.top) / cellSize);
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          setHoverCell([row, col]);
        } else {
          setHoverCell(null);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (!gridRef.current || !draggedPiece) return;
      const rect = gridRef.current.getBoundingClientRect();
      const cellSize = rect.width / gridSize;
      const col = Math.floor((e.clientX - rect.left) / cellSize);
      const row = Math.floor((e.clientY - rect.top) / cellSize);
      if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
        if (canPlaceOnGrid(grid, draggedPiece, row, col, gridSize)) {
          placeAndTrack(draggedPiece, row, col);
        }
      }
      setDraggedPiece(null);
      setHoverCell(null);
      setFloatingPos(null);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setDraggedPiece(null);
      setHoverCell(null);
      setFloatingPos(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [draggedPiece, grid, gridSize]);

  const handleTouchStart = (piece: PieceShape) => {
    if (!gameStarted || isComplete) return;
    touchPieceRef.current = piece;
    setDraggedPiece(piece);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchPieceRef.current || !gridRef.current) return;
    const touch = e.touches[0];
    setFloatingPos({ x: touch.clientX, y: touch.clientY });
    const rect = gridRef.current.getBoundingClientRect();
    const cellSize = rect.width / gridSize;
    const col = Math.floor((touch.clientX - rect.left) / cellSize);
    const row = Math.floor((touch.clientY - rect.top) / cellSize);
    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      setHoverCell([row, col]);
    } else {
      setHoverCell(null);
    }
  };

  const handleTouchEnd = () => {
    if (!touchPieceRef.current || !hoverCell) {
      setHoverCell(null);
      setDraggedPiece(null);
      setFloatingPos(null);
      touchPieceRef.current = null;
      return;
    }

    const piece = touchPieceRef.current;
    const [row, col] = hoverCell;
    if (canPlaceOnGrid(grid, piece, row, col, gridSize)) {
      placeAndTrack(piece, row, col);
    }

    setHoverCell(null);
    setDraggedPiece(null);
    setFloatingPos(null);
    touchPieceRef.current = null;
  };

  // --- Long press on grid cell to pick up placed piece ---
  // Detect touch device
  const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const handleGridCellPointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (!gameStarted || isComplete) return;
    const pieceId = pieceIdGrid[r]?.[c];
    if (!pieceId) return;

    if (isTouchDevice()) {
      // Mobile: long press to pick up
      longPressActiveRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        longPressActiveRef.current = true;
        const piece = removePieceFromGrid(pieceId);
        if (piece) {
          setPieces(prev => [...prev, piece]);
          touchPieceRef.current = piece;
          setDraggedPiece(piece);
          setFloatingPos({ x: e.clientX, y: e.clientY });
        }
      }, LONG_PRESS_MS);
    } else {
      // PC: left click picks up piece to follow mouse
      if (e.button === 0) {
        const piece = removePieceFromGrid(pieceId);
        if (piece) {
          setPieces(prev => [...prev, piece]);
          setDraggedPiece(piece);
          setFloatingPos({ x: e.clientX, y: e.clientY });
        }
      }
    }
  };

  // PC: right-click → if dragging cancel drag, otherwise remove placed piece to tray
  const handleGridCellContextMenu = (r: number, c: number, e: React.MouseEvent) => {
    if (!gameStarted || isComplete) return;
    e.preventDefault();

    if (draggedPiece) {
      setDraggedPiece(null);
      setHoverCell(null);
      setFloatingPos(null);
      return;
    }

    const pieceId = pieceIdGrid[r]?.[c];
    if (!pieceId) return;
    const piece = removePieceFromGrid(pieceId);
    if (piece) {
      setPieces(prev => [...prev, piece]);
    }
  };

  // Right-click on grid container to cancel drag
  const handleGridContextMenu = (e: React.MouseEvent) => {
    if (draggedPiece) {
      e.preventDefault();
      setDraggedPiece(null);
      setHoverCell(null);
      setFloatingPos(null);
    }
  };

  const handleGridCellPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleGridCellPointerLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const canPlaceHover = draggedPiece && hoverCell
    ? canPlaceOnGrid(grid, draggedPiece, hoverCell[0], hoverCell[1], gridSize)
    : false;

  if (loading) return <div className="min-h-screen bg-background grid-pattern flex items-center justify-center"><p className="text-muted-foreground">Yükleniyor...</p></div>;
  if (!user) return null;

  const cellPx = gridSize <= 4 ? 64 : gridSize <= 5 ? 56 : 48;

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg text-primary neon-text cursor-pointer" onClick={() => navigate('/')}>ARENA</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-md text-accent text-sm hover:bg-accent/20 transition-all sm:hidden">
              <Trophy className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/profile')} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-md text-foreground text-sm hover:bg-muted/80 transition-all">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{user.name}</span>
            </button>
            <button onClick={async () => { await logout(); navigate('/auth'); }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Çıkış">
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
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {(Object.keys(difficultyLabels) as BlockDifficulty[]).map(d => (
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

            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-md border border-border">
                <Timer className="w-4 h-4 text-primary" />
                <span className="font-mono text-lg text-foreground font-bold">{formatTime(timer)}</span>
              </div>
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border border-border text-sm text-muted-foreground">
                Parça: <span className="text-foreground font-bold">{pieces.length}</span>
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
                {user?.isAnonymous && (
                  <button
                    onClick={() => {
                      savePendingScore({ game: 'blockpuzzle', difficulty, score: timer, returnPath: '/blockpuzzle' });
                      navigate('/auth');
                    }}
                    className="mt-2 text-xs text-accent underline hover:text-accent/80 transition-colors"
                  >
                    Skorunuzu kaydetmek için giriş yapın →
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <div className={!gameStarted ? 'blur-md pointer-events-none select-none' : ''}>
                <div
                  ref={gridRef}
                  className="border-2 border-border rounded-lg bg-card/50 mx-auto relative"
                  style={{ width: cellPx * gridSize + 4, height: cellPx * gridSize + 4 }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragLeave={() => setHoverCell(null)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onContextMenu={handleGridContextMenu}
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridSize}, ${cellPx}px)`,
                      gridTemplateRows: `repeat(${gridSize}, ${cellPx}px)`,
                    }}
                  >
                    {grid.map((row, r) =>
                      row.map((cell, c) => {
                        const isHoverTarget = draggedPiece && hoverCell &&
                          draggedPiece.cells.some(([dr, dc]) => hoverCell[0] + dr === r && hoverCell[1] + dc === c);
                        const hasPiece = !!pieceIdGrid[r]?.[c];
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`border border-border/50 transition-all duration-150 ${
                              cell ? 'cursor-pointer' : 'bg-muted/20'
                            } ${isHoverTarget ? (canPlaceHover ? 'ring-2 ring-primary/60 bg-primary/20' : 'ring-2 ring-destructive/60 bg-destructive/20') : ''}`}
                            style={{
                              width: cellPx,
                              height: cellPx,
                              backgroundColor: cell || undefined,
                              opacity: cell ? 0.85 : undefined,
                              touchAction: hasPiece ? 'none' : undefined,
                            }}
                            onPointerDown={hasPiece ? (e) => handleGridCellPointerDown(r, c, e) : undefined}
                            onPointerUp={hasPiece ? handleGridCellPointerUp : undefined}
                            onPointerLeave={hasPiece ? handleGridCellPointerLeave : undefined}
                            onContextMenu={hasPiece ? (e) => handleGridCellContextMenu(r, c, e) : undefined}
                          />
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-card/50 border border-border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-3 font-display">PARÇALAR — <span className="text-primary/70">Taşımak için basılı tutun</span></p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {pieces.map(piece => {
                      const maxR = Math.max(...piece.cells.map(([r]) => r)) + 1;
                      const maxC = Math.max(...piece.cells.map(([, c]) => c)) + 1;
                      const miniCell = 20;
                      return (
                        <div
                          key={piece.id}
                          draggable
                          onDragStart={(e) => handleDragStart(piece, e)}
                          onDragEnd={handleDragEnd}
                          onTouchStart={() => handleTouchStart(piece)}
                          className="cursor-grab active:cursor-grabbing p-2 bg-muted/30 border border-border/50 rounded-md hover:border-primary/40 hover:bg-muted/50 transition-all"
                          style={{ touchAction: 'none' }}
                        >
                          <div
                            className="grid gap-px"
                            style={{
                              gridTemplateColumns: `repeat(${maxC}, ${miniCell}px)`,
                              gridTemplateRows: `repeat(${maxR}, ${miniCell}px)`,
                            }}
                          >
                            {Array.from({ length: maxR }, (_, r) =>
                              Array.from({ length: maxC }, (_, c) => {
                                const filled = piece.cells.some(([pr, pc]) => pr === r && pc === c);
                                return (
                                  <div
                                    key={`${r}-${c}`}
                                    className="rounded-sm"
                                    style={{
                                      width: miniCell,
                                      height: miniCell,
                                      backgroundColor: filled ? piece.color : 'transparent',
                                      opacity: filled ? 0.9 : 0,
                                    }}
                                  />
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
          </div>

          {/* Right side: Leaderboard + Ad */}
          <div className="hidden lg:flex flex-col w-80 shrink-0 gap-6">
            <LeaderboardPanel game="blockpuzzle" difficulty={difficulty} />
            <AdBanner adSlot="RIGHT_AD_SLOT" format="vertical" />
          </div>

          {showLeaderboard && (
            <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm lg:hidden p-4 overflow-auto">
              <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-display text-sm text-accent">SKOR TABLOSU</h2>
                  <button onClick={() => setShowLeaderboard(false)} className="text-muted-foreground hover:text-foreground text-2xl">×</button>
                </div>
                <LeaderboardPanel game="blockpuzzle" difficulty={difficulty} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating ghost piece — larger size */}
      {draggedPiece && floatingPos && (
        <div
          className="fixed pointer-events-none z-[100]"
          style={{
            left: floatingPos.x - 16,
            top: floatingPos.y - 16,
          }}
        >
          <div
            className="grid gap-px opacity-85"
            style={{
              gridTemplateColumns: `repeat(${Math.max(...draggedPiece.cells.map(([, c]) => c)) + 1}, ${cellPx}px)`,
              gridTemplateRows: `repeat(${Math.max(...draggedPiece.cells.map(([r]) => r)) + 1}, ${cellPx}px)`,
            }}
          >
            {Array.from({ length: Math.max(...draggedPiece.cells.map(([r]) => r)) + 1 }, (_, r) =>
              Array.from({ length: Math.max(...draggedPiece.cells.map(([, c]) => c)) + 1 }, (_, c) => {
                const filled = draggedPiece.cells.some(([pr, pc]) => pr === r && pc === c);
                return (
                  <div
                    key={`ghost-${r}-${c}`}
                    className="rounded-sm"
                    style={{
                      width: cellPx,
                      height: cellPx,
                      backgroundColor: filled ? draggedPiece.color : 'transparent',
                      opacity: filled ? 0.9 : 0,
                      boxShadow: filled ? `0 0 12px ${draggedPiece.color}` : undefined,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockPuzzlePage;
