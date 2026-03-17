// Block Puzzle game logic - Tetris-like pieces on a grid

export type BlockDifficulty = 'easy' | 'medium' | 'hard';

export interface PieceShape {
  id: string;
  cells: [number, number][]; // relative [row, col] offsets
  color: string;
}

export const GRID_SIZES: Record<BlockDifficulty, number> = {
  easy: 4,
  medium: 5,
  hard: 6,
};

// Only multi-cell shapes (no singles)
const SHAPES_POOL: [number, number][][] = [
  // 4-cell pieces (tetrominoes)
  [[0,0],[0,1],[0,2],[0,3]], // I horiz
  [[0,0],[1,0],[2,0],[3,0]], // I vert
  [[0,0],[1,0],[2,0],[2,1]], // L
  [[0,0],[0,1],[0,2],[1,0]], // L rotated
  [[0,0],[0,1],[1,1],[2,1]], // J
  [[0,0],[0,1],[0,2],[1,2]], // J rotated
  [[0,0],[0,1],[0,2],[1,1]], // T
  [[0,0],[1,0],[1,1],[2,0]], // T rotated
  [[0,0],[0,1],[1,1],[1,2]], // S
  [[0,1],[0,2],[1,0],[1,1]], // Z
  [[0,0],[0,1],[1,0],[1,1]], // O (square)
  // 3-cell pieces (triominoes)
  [[0,0],[0,1],[0,2]],       // I3 horiz
  [[0,0],[1,0],[2,0]],       // I3 vert
  [[0,0],[0,1],[1,0]],       // L3
  [[0,0],[0,1],[1,1]],       // L3 mirror
  [[0,0],[1,0],[1,1]],       // L3 rotated
  [[0,1],[1,0],[1,1]],       // L3 rotated mirror
  // 2-cell pieces (dominoes)
  [[0,0],[0,1]],             // domino horiz
  [[0,0],[1,0]],             // domino vert
  // 5-cell pieces (pentominoes) - for harder puzzles
  [[0,0],[0,1],[0,2],[0,3],[0,4]], // I5
  [[0,0],[1,0],[2,0],[3,0],[4,0]], // I5 vert
  [[0,0],[0,1],[0,2],[1,0],[1,1]], // P
  [[0,0],[0,1],[1,1],[1,2],[2,2]], // W step
  [[0,0],[1,0],[1,1],[2,1],[2,2]], // W step mirror
  [[0,0],[0,1],[0,2],[1,1],[2,1]], // plus-ish
  [[0,0],[0,1],[0,2],[1,0],[2,0]], // big L
];

const PIECE_COLORS = [
  'hsl(160 100% 50%)',
  'hsl(270 80% 60%)',
  'hsl(45 100% 55%)',
  'hsl(200 80% 55%)',
  'hsl(340 80% 55%)',
  'hsl(120 60% 45%)',
  'hsl(30 90% 55%)',
  'hsl(180 70% 45%)',
  'hsl(300 70% 55%)',
  'hsl(15 85% 50%)',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Difficulty-based shape filtering
function getShapesForDifficulty(difficulty: BlockDifficulty): [number, number][][] {
  switch (difficulty) {
    case 'easy':
      // 2, 3, 4-cell shapes only
      return SHAPES_POOL.filter(s => s.length >= 2 && s.length <= 4);
    case 'medium':
      // 3, 4, 5-cell shapes (no dominoes → harder)
      return SHAPES_POOL.filter(s => s.length >= 3);
    case 'hard':
      // 4, 5-cell shapes only → fewest pieces, hardest placement
      return SHAPES_POOL.filter(s => s.length >= 4);
  }
}

// Backtracking puzzle generator that guarantees no single-cell leftovers
export function generatePuzzle(difficulty: BlockDifficulty): { pieces: PieceShape[]; gridSize: number } {
  const gridSize = GRID_SIZES[difficulty];
  const allowedShapes = getShapesForDifficulty(difficulty);

  // Try multiple times to generate a valid puzzle
  for (let attempt = 0; attempt < 50; attempt++) {
    const result = tryGenerate(gridSize, allowedShapes);
    if (result) {
      const pieces: PieceShape[] = result.map((cells, i) => ({
        id: `piece-${i}`,
        cells,
        color: PIECE_COLORS[i % PIECE_COLORS.length],
      }));
      return { pieces: shuffle(pieces), gridSize };
    }
  }

  // Fallback: allow dominoes for any difficulty
  const fallbackShapes = SHAPES_POOL.filter(s => s.length >= 2);
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = tryGenerate(gridSize, fallbackShapes);
    if (result) {
      const pieces: PieceShape[] = result.map((cells, i) => ({
        id: `piece-${i}`,
        cells,
        color: PIECE_COLORS[i % PIECE_COLORS.length],
      }));
      return { pieces: shuffle(pieces), gridSize };
    }
  }

  // Ultimate fallback with dominoes guaranteed
  return generateGreedy(gridSize);
}

function tryGenerate(
  gridSize: number,
  shapes: [number, number][][]
): [number, number][][] | null {
  const grid: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const placed: [number, number][][] = [];
  return backtrack(grid, gridSize, shapes, placed);
}

function backtrack(
  grid: boolean[][],
  gridSize: number,
  shapes: [number, number][][],
  placed: [number, number][][]
): [number, number][][] | null {
  // Find first empty cell
  let emptyR = -1, emptyC = -1;
  for (let r = 0; r < gridSize && emptyR < 0; r++) {
    for (let c = 0; c < gridSize && emptyR < 0; c++) {
      if (!grid[r][c]) { emptyR = r; emptyC = c; }
    }
  }
  if (emptyR < 0) return [...placed]; // All filled!

  // Try placing each shape so it covers the empty cell
  const shuffled = shuffle(shapes);
  for (const shape of shuffled) {
    // For each cell in the shape, try aligning it to (emptyR, emptyC)
    for (const [anchorR, anchorC] of shape) {
      const offsetR = emptyR - anchorR;
      const offsetC = emptyC - anchorC;
      const translated = shape.map(([dr, dc]) => [offsetR + dr, offsetC + dc] as [number, number]);

      if (canPlace(grid, translated, gridSize)) {
        // Place
        translated.forEach(([r, c]) => { grid[r][c] = true; });
        placed.push(shape);

        const result = backtrack(grid, gridSize, shapes, placed);
        if (result) return result;

        // Undo
        translated.forEach(([r, c]) => { grid[r][c] = false; });
        placed.pop();
      }
    }
  }

  return null; // No valid placement found
}

function generateGreedy(gridSize: number): { pieces: PieceShape[]; gridSize: number } {
  const grid: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));
  const pieces: PieceShape[] = [];
  let id = 0;
  const allShapes = SHAPES_POOL.filter(s => s.length >= 2);

  while (countFilled(grid) < gridSize * gridSize) {
    let placed = false;
    for (const shape of shuffle(allShapes)) {
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const translated = shape.map(([dr, dc]) => [r + dr, c + dc] as [number, number]);
          if (canPlace(grid, translated, gridSize)) {
            translated.forEach(([pr, pc]) => { grid[pr][pc] = true; });
            pieces.push({ id: `piece-${id++}`, cells: shape, color: PIECE_COLORS[id % PIECE_COLORS.length] });
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      if (placed) break;
    }
    if (!placed) {
      // Fill remaining with dominoes at minimum
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          if (!grid[r][c]) {
            // Try domino right
            if (c + 1 < gridSize && !grid[r][c + 1]) {
              grid[r][c] = true; grid[r][c + 1] = true;
              pieces.push({ id: `piece-${id++}`, cells: [[0,0],[0,1]], color: PIECE_COLORS[id % PIECE_COLORS.length] });
            } else if (r + 1 < gridSize && !grid[r + 1][c]) {
              grid[r][c] = true; grid[r + 1][c] = true;
              pieces.push({ id: `piece-${id++}`, cells: [[0,0],[1,0]], color: PIECE_COLORS[id % PIECE_COLORS.length] });
            } else {
              // Absolute last resort single
              grid[r][c] = true;
              pieces.push({ id: `piece-${id++}`, cells: [[0,0]], color: PIECE_COLORS[id % PIECE_COLORS.length] });
            }
          }
        }
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
