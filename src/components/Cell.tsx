import { Position } from '../types';

interface CellProps {
  value: number | null;
  position: Position;
  isSelected: boolean;
  isInvalid: boolean;
  isHint?: boolean;
  isNew?: boolean;
  onClick: (position: Position) => void;
}

export function Cell({ value, position, isSelected, isInvalid, isHint = false, isNew = false, onClick }: CellProps) {
  const handleClick = () => {
    onClick(position);
  };

  const isEmpty = value === null;

  return (
    <button
      className={`cell ${isSelected ? 'selected' : ''} ${isEmpty ? 'empty' : ''} ${isInvalid ? 'invalid' : ''} ${isHint ? 'hint' : ''} ${isNew ? 'new' : ''}`}
      onClick={handleClick}
      disabled={isEmpty}
    >
      {value}
    </button>
  );
}
