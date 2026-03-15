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
    <button
      onClick={onClick}
      disabled={disabled || isRevealed}
      className={`aspect-square rounded-lg text-3xl sm:text-4xl font-bold transition-all duration-300 transform ${
        card.isMatched
          ? 'bg-primary/20 border-2 border-primary/50 scale-95 cursor-default'
          : isRevealed
            ? 'bg-card border-2 border-primary neon-box scale-105'
            : 'bg-muted border-2 border-border hover:border-primary/40 hover:scale-105 cursor-pointer active:scale-95'
      }`}
      aria-label={isRevealed ? card.emoji : 'Hidden card'}
    >
      <span
        className={`transition-all duration-300 ${
          isRevealed ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`}
      >
        {isRevealed ? card.emoji : ''}
      </span>
      {!isRevealed && (
        <span className="text-muted-foreground text-lg">?</span>
      )}
    </button>
  );
};

export default MemoryCard;
