// Block Puzzle game logic - Tetris-like pieces on a grid

export type BlockDifficulty = 'easy' | 'medium' | 'hard';

export interface PieceShape {
  id: string;
  cells: [number, number][]; // relative [row, col] offsets
  color: string; // HSL CSS variable token
}

export const GRID_SIZES: Record<BlockDifficulty, number> = {
  easy: 4,
  medium: 5,
  hard: 6,
};

// All tetromino + small shapes
const BASE_SHAPES: [number, number][][] = [
  // I-shapes
  [[0,0],[0,1],[0,2],[0,3]],
  [[0,0],[1,0],[2,0],[3,0]],
  // L-shapes
  [[0,0],[1,0],[2,0],[2,1]],
  [[0,0],[0,1],[0,2],[1,0]],
  [[0,0],[0,1],[1,1],[2,1]],
  [[0,0],[0,1],[0,2],[1,2]],
  // T-shape
  [[0,0],[0,1],[0,2],[1,1]],
  [[0,0],[1,0],[1,1],[2,0]],
  // S/Z shapes
  [[0,0],[0,1],[1,1],[1,2]],
  [[0,1],[0,2],[1,0],[1,1]],
  // Square
  [[0,0],[0,1],[1,0],[1,1]],
  // Small pieces
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0]],
  [[0,0]],
  // Corner
  [[0,0],[0,1],[1,0]],
  [[0,0],[0,1],[1,1]],
];

const PIECE_COLORS = [
  'hsl(160 100% 50%)',   // primary green
  'hsl(270 80% 60%)',    // secondary purple
  'hsl(45 100% 55%)',    // accent gold
  'hsl(200 80% 55%)',    // cyan
  'hsl(340 80% 55%)',    // pink
  'hsl(120 60% 45%)',    // green
  'hsl(30 90% 55%)',     // orange
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Generate a solvable puzzle: fill the grid with pieces, then return those pieces shuffled
export function generatePuzzle(difficulty: BlockDifficulty): { pieces: PieceShape[]; gridSize: number } {
  const gridSize = GRID_SIZES[difficulty];
  const totalCells = gridSize * gridSize;
  const grid: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const pieces: PieceShape[] = [];
  let pieceId = 0;

  // Greedy fill: try to place random shapes
  let attempts = 0;
  while (countFilled(grid) < totalCells && attempts < 1000) {
    attempts++;
    const shuffledShapes = shuffle(BASE_SHAPES);
    let placed = false;

    for (const shape of shuffledShapes) {
      // Try all positions
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const translated = shape.map(([dr, dc]) => [r + dr, c + dc] as [number, number]);
          if (canPlace(grid, translated, gridSize)) {
            // Place it
            translated.forEach(([pr, pc]) => { grid[pr][pc] = true; });
            pieces.push({
              id: `piece-${pieceId++}`,
              cells: shape,
              color: PIECE_COLORS[pieceId % PIECE_COLORS.length],
            });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (placed) break;
    }

    // If nothing fits, fill single cells
    if (!placed) {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (!grid[r][c]) {
            grid[r][c] = true;
            pieces.push({
              id: `piece-${pieceId++}`,
              cells: [[0, 0]],
              color: PIECE_COLORS[pieceId % PIECE_COLORS.length],
            });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
    }
  }

  return { pieces: shuffle(pieces), gridSize };
}

function countFilled(grid: boolean[][]): number {
  return grid.flat().filter(Boolean).length;
}

function canPlace(grid: boolean[][], cells: [number, number][], gridSize: number): boolean {
  return cells.every(([r, c]) => r >= 0 && r < gridSize && c >= 0 && c < gridSize && !grid[r][c]);
}

export function canPlaceOnGrid(
  grid: (string | null)[][],
  piece: PieceShape,
  row: number,
  col: number,
  gridSize: number
): boolean {
  return piece.cells.every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < gridSize && c >= 0 && c < gridSize && grid[r][c] === null;
  });
}

export function placePieceOnGrid(
  grid: (string | null)[][],
  piece: PieceShape,
  row: number,
  col: number
): (string | null)[][] {
  const newGrid = grid.map(r => [...r]);
  piece.cells.forEach(([dr, dc]) => {
    newGrid[row + dr][col + dc] = piece.color;
  });
  return newGrid;
}

export function isGridComplete(grid: (string | null)[][]): boolean {
  return grid.every(row => row.every(cell => cell !== null));
}

export function createEmptyGrid(size: number): (string | null)[][] {
  return Array.from({ length: size }, () => Array(size).fill(null));
}
