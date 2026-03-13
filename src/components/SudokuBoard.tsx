import React from 'react';

interface SudokuBoardProps {
  board: (number | null)[][];
  puzzle: (number | null)[][];
  selectedCell: [number, number] | null;
  onCellClick: (row: number, col: number) => void;
  errors: Set<string>;
}

const SudokuBoard: React.FC<SudokuBoardProps> = ({ board, puzzle, selectedCell, onCellClick, errors }) => {
  return (
    <div className="inline-block border-2 border-primary neon-box rounded-md overflow-hidden">
      {board.map((row, r) => (
        <div key={r} className="flex">
          {row.map((cell, c) => {
            const isOriginal = puzzle[r][c] !== null;
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isSameRow = selectedCell?.[0] === r;
            const isSameCol = selectedCell?.[1] === c;
            const isSameBox =
              selectedCell &&
              Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
              Math.floor(selectedCell[1] / 3) === Math.floor(c / 3);
            const isHighlighted = !isSelected && (isSameRow || isSameCol || isSameBox);
            const hasError = errors.has(`${r}-${c}`);

            const borderRight = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-r-primary/50' : 'border-r border-r-border';
            const borderBottom = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-b-primary/50' : 'border-b border-b-border';

            return (
              <button
                key={c}
                onClick={() => onCellClick(r, c)}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
                  font-mono text-lg sm:text-xl font-bold transition-all
                  ${borderRight} ${borderBottom}
                  ${isSelected 
                    ? 'bg-primary/20 ring-2 ring-primary ring-inset' 
                    : isHighlighted 
                      ? 'bg-muted/60' 
                      : 'bg-card'
                  }
                  ${isOriginal ? 'text-foreground' : 'text-primary'}
                  ${hasError ? 'text-destructive bg-destructive/10' : ''}
                  ${!isOriginal ? 'cursor-pointer hover:bg-muted/40' : 'cursor-default'}
                `}
              >
                {cell || ''}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SudokuBoard;
