import { useState, useCallback, useEffect } from 'react';
import { Board, Position } from '../types';
import { generateBoard, addRows } from '../utils/boardGenerator';
import { canMatch, removeMatch, calculateScore, isBoardCleared, removeClearedRows, getClearedRowIndices, getMatchDistance } from '../utils/gameLogic';
import { playMatchSound, playRowClearSound, playStageCompleteSound } from '../utils/sounds';

const ROW_CLEAR_ANIMATION_MS = 400;

const INITIAL_ROWS = 10;
const COLS = 9;
const ROWS_TO_ADD = 4;
const MAX_ADD_ROWS = 4;

export function useGame() {
  const [stage, setStage] = useState(1);
  const [board, setBoard] = useState<Board>(() =>
    generateBoard({ rows: INITIAL_ROWS, cols: COLS, stage: 1 })
  );
  const [score, setScore] = useState(0);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [addRowsRemaining, setAddRowsRemaining] = useState(MAX_ADD_ROWS);
  const [stageComplete, setStageComplete] = useState(false);
  const [clearingRows, setClearingRows] = useState<number[]>([]);

  // Check for board cleared and show completion modal
  useEffect(() => {
    if (isBoardCleared(board) && !stageComplete) {
      setStageComplete(true);
      setSelectedCell(null);
      playStageCompleteSound();
    }
  }, [board, stageComplete]);

  // Handle continuing to next stage
  const handleContinue = useCallback(() => {
    const nextStage = stage + 1;
    setStage(nextStage);
    setBoard(generateBoard({ rows: INITIAL_ROWS, cols: COLS, stage: nextStage }));
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
          const distance = getMatchDistance(board, selectedCell, position);
          const boardAfterMatch = removeMatch(board, selectedCell, position);
          setScore((s) => s + points);

          // Play match sound (pitch increases with distance)
          playMatchSound(distance);

          // Check for cleared rows
          const clearedIndices = getClearedRowIndices(boardAfterMatch);
          if (clearedIndices.length > 0) {
            // Show clearing animation first
            setBoard(boardAfterMatch);
            setClearingRows(clearedIndices);

            // Play row clear sound after a short delay
            setTimeout(() => playRowClearSound(), 100);

            // After animation, actually remove the rows
            setTimeout(() => {
              setClearingRows([]);
              setBoard((currentBoard) => removeClearedRows(currentBoard));
            }, ROW_CLEAR_ANIMATION_MS);
          } else {
            setBoard(boardAfterMatch);
          }
        }
        setSelectedCell(null);
      }
    },
    [board, selectedCell]
  );

  const handleAddRows = useCallback(() => {
    if (addRowsRemaining <= 0) return;

    setBoard((b) => addRows(b, ROWS_TO_ADD, COLS, stage));
    setAddRowsRemaining((r) => r - 1);
  }, [addRowsRemaining, stage]);

  const handleNewGame = useCallback(() => {
    setStage(1);
    setBoard(generateBoard({ rows: INITIAL_ROWS, cols: COLS, stage: 1 }));
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
    clearingRows,
    handleCellClick,
    handleAddRows,
    handleNewGame,
    handleContinue,
  };
}
