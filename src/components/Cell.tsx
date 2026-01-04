import { Position } from '../types';

interface CellProps {
  value: number | null;
  position: Position;
  isSelected: boolean;
  isInvalid: boolean;
  isHint?: boolean;
  onClick: (position: Position) => void;
}

export function Cell({ value, position, isSelected, isInvalid, isHint = false, onClick }: CellProps) {
  const handleClick = () => {
    onClick(position);
  };

  const isEmpty = value === null;

  return (
    <button
      className={`cell ${isSelected ? 'selected' : ''} ${isEmpty ? 'empty' : ''} ${isInvalid ? 'invalid' : ''} ${isHint ? 'hint' : ''}`}
      onClick={handleClick}
      disabled={isEmpty}
    >
      {value}
    </button>
  );
}
