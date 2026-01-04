import { Position } from '../types';

interface CellProps {
  value: number | null;
  position: Position;
  isSelected: boolean;
  isInvalid: boolean;
  onClick: (position: Position) => void;
}

export function Cell({ value, position, isSelected, isInvalid, onClick }: CellProps) {
  const handleClick = () => {
    onClick(position);
  };

  const isEmpty = value === null;

  return (
    <button
      className={`cell ${isSelected ? 'selected' : ''} ${isEmpty ? 'empty' : ''} ${isInvalid ? 'invalid' : ''}`}
      onClick={handleClick}
      disabled={isEmpty}
    >
      {value}
    </button>
  );
}
