export type Cell = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
};

export type Difficulty = 'easy' | 'medium' | 'hard';

export const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

const sizeMap: Record<Difficulty, number> = {
  easy: 8,
  medium: 11,
  hard: 15,
};

/** BFS: find shortest path from start to target, returns list of cells or null */
export function findPath(grid: Cell[][], start: [number, number], target: [number, number]): [number, number][] | null {
  const size = grid.length;
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const parent = new Map<string, [number, number] | null>();
  const queue: [number, number][] = [start];
  const key = (r: number, c: number) => `${r},${c}`;
  visited[start[0]][start[1]] = true;
  parent.set(key(start[0], start[1]), null);

  const dirs: { dir: 'up' | 'down' | 'left' | 'right'; dr: number; dc: number }[] = [
    { dir: 'up', dr: -1, dc: 0 }, { dir: 'down', dr: 1, dc: 0 },
    { dir: 'left', dr: 0, dc: -1 }, { dir: 'right', dr: 0, dc: 1 },
  ];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    if (r === target[0] && c === target[1]) {
      const path: [number, number][] = [];
      let cur: [number, number] | null = target;
      while (cur) {
        path.unshift(cur);
        cur = parent.get(key(cur[0], cur[1])) ?? null;
      }
      return path;
    }
    for (const d of dirs) {
      const nr = r + d.dr, nc = c + d.dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc] && canMove(grid, r, c, d.dir)) {
        visited[nr][nc] = true;
        parent.set(key(nr, nc), [r, c]);
        queue.push([nr, nc]);
      }
    }
  }
  return null;
}

/** Get Manhattan distance between two cells */
export function cellDistance(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

/** Find teleportable points: walk in each open direction from pos until hitting a wall.
 *  Returns the furthest reachable cell in each direction (excluding current pos). */
export function getTeleportTargets(grid: Cell[][], pos: [number, number]): [number, number][] {
  const [r, c] = pos;
  const targets: [number, number][] = [];
  const dirs: { dir: 'up' | 'down' | 'left' | 'right'; dr: number; dc: number }[] = [
    { dir: 'up', dr: -1, dc: 0 }, { dir: 'down', dr: 1, dc: 0 },
    { dir: 'left', dr: 0, dc: -1 }, { dir: 'right', dr: 0, dc: 1 },
  ];

  for (const d of dirs) {
    let cr = r, cc = c;
    while (canMove(grid, cr, cc, d.dir)) {
      cr += d.dr;
      cc += d.dc;
    }
    if (cr !== r || cc !== c) {
      targets.push([cr, cc]);
    }
  }
  return targets;
}

export function getMazeSize(difficulty: Difficulty): number {
  return sizeMap[difficulty];
}

export function generateMaze(size: number): Cell[][] {
  // Initialize grid with all walls
  const grid: Cell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
    }))
  );

  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const stack: [number, number][] = [];

  const directions: { dr: number; dc: number; wall: keyof Cell; opposite: keyof Cell }[] = [
    { dr: -1, dc: 0, wall: 'top', opposite: 'bottom' },
    { dr: 0, dc: 1, wall: 'right', opposite: 'left' },
    { dr: 1, dc: 0, wall: 'bottom', opposite: 'top' },
    { dr: 0, dc: -1, wall: 'left', opposite: 'right' },
  ];

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Recursive backtracking
  const startR = 0, startC = 0;
  visited[startR][startC] = true;
  stack.push([startR, startC]);

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = shuffle(directions).filter(d => {
      const nr = r + d.dr;
      const nc = c + d.dc;
      return nr >= 0 && nr < size && nc >= 0 && nc < size && !visited[nr][nc];
    });

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const d = neighbors[0];
      const nr = r + d.dr;
      const nc = c + d.dc;
      grid[r][c][d.wall] = false;
      grid[nr][nc][d.opposite] = false;
      visited[nr][nc] = true;
      stack.push([nr, nc]);
    }
  }

  return grid;
}

export function canMove(grid: Cell[][], r: number, c: number, dir: 'up' | 'down' | 'left' | 'right'): boolean {
  const wallMap: Record<string, keyof Cell> = {
    up: 'top',
    down: 'bottom',
    left: 'left',
    right: 'right',
  };
  return !grid[r][c][wallMap[dir]];
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
