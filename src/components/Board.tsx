import { Board as BoardType, Position } from '../types';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  selectedCell: Position | null;
  onCellClick: (position: Position) => void;
}

export function Board({ board, selectedCell, onCellClick }: BoardProps) {
  return (
    <div className="board">
      {board.map((row, rowIdx) => (
        <div key={rowIdx} className="row">
          {row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              value={cell.value}
              position={cell.position}
              isSelected={
                selectedCell?.row === rowIdx && selectedCell?.col === colIdx
              }
              onClick={onCellClick}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
