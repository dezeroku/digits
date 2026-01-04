import { useState, useCallback, useEffect } from 'react';
import { Board, Position } from '../types';
import { generateBoard, addRows, getDifficultyForStage } from '../utils/boardGenerator';
import { canMatch, removeMatch, calculateScore, isBoardCleared } from '../utils/gameLogic';

const INITIAL_ROWS = 10;
const COLS = 9;
const ROWS_TO_ADD = 4;
const MAX_ADD_ROWS = 4;

export function useGame() {
  const [stage, setStage] = useState(1);
  const [board, setBoard] = useState<Board>(() =>
    generateBoard({ rows: INITIAL_ROWS, cols: COLS, difficulty: 'easy' })
  );
  const [score, setScore] = useState(0);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [addRowsRemaining, setAddRowsRemaining] = useState(MAX_ADD_ROWS);
  const [stageComplete, setStageComplete] = useState(false);

  // Check for board cleared and show completion modal
  useEffect(() => {
    if (isBoardCleared(board) && !stageComplete) {
      setStageComplete(true);
      setSelectedCell(null);
    }
  }, [board, stageComplete]);

  // Handle continuing to next stage
  const handleContinue = useCallback(() => {
    const nextStage = stage + 1;
    const difficulty = getDifficultyForStage(nextStage);
    setStage(nextStage);
    setBoard(generateBoard({ rows: INITIAL_ROWS, cols: COLS, difficulty }));
    setAddRowsRemaining(MAX_ADD_ROWS);
    setStageComplete(false);
  }, [stage]);

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
    if (addRowsRemaining <= 0) return;

    const difficulty = getDifficultyForStage(stage);
    setBoard((b) => addRows(b, ROWS_TO_ADD, COLS, difficulty));
    setAddRowsRemaining((r) => r - 1);
  }, [addRowsRemaining, stage]);

  const handleNewGame = useCallback(() => {
    setStage(1);
    setBoard(generateBoard({ rows: INITIAL_ROWS, cols: COLS, difficulty: 'easy' }));
    setScore(0);
    setSelectedCell(null);
    setAddRowsRemaining(MAX_ADD_ROWS);
    setStageComplete(false);
  }, []);

  return {
    board,
    score,
    selectedCell,
    stage,
    stageComplete,
    addRowsRemaining,
    handleCellClick,
    handleAddRows,
    handleNewGame,
    handleContinue,
  };
}
