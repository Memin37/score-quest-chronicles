import React from 'react';
import { PenLine } from 'lucide-react';

interface NumberPadProps {
  onNumber: (n: number) => void;
  onClear: () => void;
  notesMode: boolean;
  onToggleNotes: () => void;
  completedNumbers?: Set<number>;
}

const NumberPad: React.FC<NumberPadProps> = ({ onNumber, onClear, notesMode, onToggleNotes, completedNumbers }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-5 gap-2 max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
          const isCompleted = completedNumbers?.has(n) ?? false;
          return (
            <button
              key={n}
              onClick={() => !isCompleted && onNumber(n)}
              disabled={isCompleted}
              className={`w-12 h-12 rounded-md font-mono text-lg font-bold transition-all ${
                isCompleted
                  ? 'bg-muted/40 border border-border/50 text-muted-foreground/30 cursor-not-allowed'
                  : 'bg-muted hover:bg-primary/20 border border-border text-foreground hover:neon-box'
              }`}
            >
              {n}
            </button>
          );
        })}
        <button
          onClick={onClear}
          className="w-12 h-12 bg-destructive/20 hover:bg-destructive/30 border border-destructive/30 rounded-md text-destructive text-sm font-semibold transition-all"
        >
          Sil
        </button>
      </div>
      <button
        onClick={onToggleNotes}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all max-w-xs ${
          notesMode
            ? 'bg-accent/20 border border-accent/50 text-accent neon-gold'
            : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
        }`}
      >
        <PenLine className="w-4 h-4" />
        Not Modu {notesMode ? 'Açık' : 'Kapalı'}
      </button>
    </div>
  );
};

export default NumberPad;
