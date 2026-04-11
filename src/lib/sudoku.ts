// Sudoku puzzle generator and solver utilities

type Board = (number | null)[][];

const EMPTY = null;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = startRow; i < startRow + 3; i++) {
    for (let j = startCol; j < startCol + 3; j++) {
      if (board[i][j] === num) return false;
    }
  }
  return true;
}

function solve(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === EMPTY) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solve(board)) return true;
            board[row][col] = EMPTY;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function generateFullBoard(): Board {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(EMPTY));
  solve(board);
  return board;
}

const CLUES_MAP: Record<string, number> = {
  easy: 45,
  medium: 35,
  hard: 25,
};

export function generateSudoku(difficulty: string): { puzzle: Board; solution: Board } {
  const solution = generateFullBoard();
  const puzzle: Board = solution.map(row => [...row]);
  const clues = CLUES_MAP[difficulty] || 35;
  const cellsToRemove = 81 - clues;

  const positions = shuffle(
    Array.from({ length: 81 }, (_, i) => [Math.floor(i / 9), i % 9] as [number, number])
  );

  let removed = 0;
  for (const [r, c] of positions) {
    if (removed >= cellsToRemove) break;
    puzzle[r][c] = EMPTY;
    removed++;
  }

  return { puzzle, solution };
}

export function checkComplete(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) return false;
    }
  }
  // Validate rows, cols, boxes
  for (let i = 0; i < 9; i++) {
    const rowSet = new Set(board[i]);
    const colSet = new Set(board.map(r => r[i]));
    if (rowSet.size !== 9 || colSet.size !== 9) return false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const boxSet = new Set<number>();
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          boxSet.add(board[r][c]!);
        }
      }
      if (boxSet.size !== 9) return false;
    }
  }
  return true;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const fractionalStr = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${fractionalStr}`;
}
