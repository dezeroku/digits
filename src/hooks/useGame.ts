import { useState, useCallback } from 'react';
import { Board, Position } from '../types';
import { generateBoard, addRows } from '../utils/boardGenerator';
import { canMatch, removeMatch, calculateScore } from '../utils/gameLogic';

const INITIAL_ROWS = 20;
const COLS = 12;
const ROWS_TO_ADD = 4;

export function useGame() {
  const [board, setBoard] = useState<Board>(() => generateBoard(INITIAL_ROWS, COLS));
  const [score, setScore] = useState(0);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);

  const handleCellClick = useCallback(
    (position: Position) => {
      const cell = board[position.row]?.[position.col];

      // Ignore clicks on empty cells
      if (!cell || cell.value === null) return;

      if (selectedCell === null) {
        // First selection
        setSelectedCell(position);
      } else if (
        selectedCell.row === position.row &&
        selectedCell.col === position.col
      ) {
        // Clicked same cell - deselect
        setSelectedCell(null);
      } else {
        // Second selection - attempt match
        if (canMatch(board, selectedCell, position)) {
          const points = calculateScore(board, selectedCell, position);
          setBoard(removeMatch(board, selectedCell, position));
          setScore((s) => s + points);
        }
        setSelectedCell(null);
      }
    },
    [board, selectedCell]
  );

  const handleAddRows = useCallback(() => {
    setBoard((b) => addRows(b, ROWS_TO_ADD, COLS));
  }, []);

  const handleNewGame = useCallback(() => {
    setBoard(generateBoard(INITIAL_ROWS, COLS));
    setScore(0);
    setSelectedCell(null);
  }, []);

  return {
    board,
    score,
    selectedCell,
    handleCellClick,
    handleAddRows,
    handleNewGame,
  };
}
