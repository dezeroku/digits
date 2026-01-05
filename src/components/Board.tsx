import { Board as BoardType, Position } from '../types';
import { Cell } from './Cell';

interface BoardProps {
  board: BoardType;
  selectedCell: Position | null;
  clearingRows?: number[];
  invalidCells?: Position[];
  hintCells?: Position[];
  newCells?: Position[];
  onCellClick: (position: Position) => void;
}

export function Board({ board, selectedCell, clearingRows = [], invalidCells = [], hintCells = [], newCells = [], onCellClick }: BoardProps) {
  const isInvalidCell = (row: number, col: number) =>
    invalidCells.some((p) => p.row === row && p.col === col);

  const isHintCell = (row: number, col: number) =>
    hintCells.some((p) => p.row === row && p.col === col);

  const isNewCell = (row: number, col: number) =>
    newCells.some((p) => p.row === row && p.col === col);

  return (
    <div className="board">
      {board.map((row, rowIdx) => {
        const rowClasses = [
          'row',
          clearingRows.includes(rowIdx) ? 'row-clearing' : '',
        ].filter(Boolean).join(' ');

        return (
        <div
          key={rowIdx}
          className={rowClasses}
        >
          {row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              value={cell.value}
              position={cell.position}
              isSelected={
                selectedCell?.row === rowIdx && selectedCell?.col === colIdx
              }
              isInvalid={isInvalidCell(rowIdx, colIdx)}
              isHint={isHintCell(rowIdx, colIdx)}
              isNew={isNewCell(rowIdx, colIdx)}
              onClick={onCellClick}
            />
          ))}
        </div>
        );
      })}
    </div>
  );
}
