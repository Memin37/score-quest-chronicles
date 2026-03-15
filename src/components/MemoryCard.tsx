import React from 'react';
import type { MemoryCard as MemoryCardType } from '@/lib/memory';

interface Props {
  card: MemoryCardType;
  onClick: () => void;
  disabled: boolean;
}

const MemoryCard: React.FC<Props> = ({ card, onClick, disabled }) => {
  const isRevealed = card.isFlipped || card.isMatched;

  return (
    <div className="aspect-square [perspective:600px]">
      <button
        onClick={onClick}
        disabled={disabled || isRevealed}
        className={`relative w-full h-full [transform-style:preserve-3d] transition-transform duration-500 ease-in-out ${
          isRevealed ? '[transform:rotateY(180deg)]' : ''
        } ${!disabled && !isRevealed ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
        aria-label={isRevealed ? card.emoji : 'Hidden card'}
      >
        {/* Back face (question mark) */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] rounded-lg flex items-center justify-center text-lg border-2 transition-colors duration-300 ${
            'bg-muted border-border hover:border-primary/40'
          }`}
        >
          <span className="text-muted-foreground font-bold text-xl">?</span>
        </div>

        {/* Front face (emoji) */}
        <div
          className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg flex items-center justify-center text-3xl sm:text-4xl border-2 transition-all duration-300 ${
            card.isMatched
              ? 'bg-primary/20 border-primary/50 scale-95'
              : 'bg-card border-primary neon-box'
          }`}
        >
          <span>{card.emoji}</span>
        </div>
      </button>
    </div>
  );
};

export default MemoryCard;
