import React from 'react';

interface NumberPadProps {
  onNumber: (n: number) => void;
  onClear: () => void;
}

const NumberPad: React.FC<NumberPadProps> = ({ onNumber, onClear }) => {
  return (
    <div className="grid grid-cols-5 gap-2 max-w-xs">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button
          key={n}
          onClick={() => onNumber(n)}
          className="w-12 h-12 bg-muted hover:bg-primary/20 border border-border rounded-md font-mono text-lg font-bold text-foreground transition-all hover:neon-box"
        >
          {n}
        </button>
      ))}
      <button
        onClick={onClear}
        className="w-12 h-12 bg-destructive/20 hover:bg-destructive/30 border border-destructive/30 rounded-md text-destructive text-sm font-semibold transition-all"
      >
        Sil
      </button>
    </div>
  );
};

export default NumberPad;
