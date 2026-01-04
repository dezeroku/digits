import { useState, useCallback, useEffect, useRef } from 'react';
import { Board, Position } from '../types';
import { generateBoard, addRows } from '../utils/boardGenerator';
import { canMatch, removeMatch, calculateScore, isBoardCleared, removeClearedRows, getClearedRowIndices, getMatchDistance, hasAnyValidMatch, findValidPair } from '../utils/gameLogic';
import { playMatchSound, playRowClearSound, playStageCompleteSound, playInvalidMatchSound, playGameStartSound } from '../utils/sounds';

const ROW_CLEAR_ANIMATION_MS = 400;
const INVALID_ANIMATION_MS = 400;
const HINT_ANIMATION_MS = 1500;
const ADD_ROWS_HINT_DELAY_MS = 30 * 1000;

const INITIAL_ROWS = 10;
const COLS = 9;
const ROWS_TO_ADD = 4;
const MAX_ADD_ROWS = 4;
const MAX_HELP = 3;

export function useGame() {
  const [stage, setStage] = useState(1);
  const [board, setBoard] = useState<Board>(() =>
    generateBoard({ rows: INITIAL_ROWS, cols: COLS, stage: 1 })
  );
  const [score, setScore] = useState(0);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [addRowsRemaining, setAddRowsRemaining] = useState(MAX_ADD_ROWS);
  const [stageComplete, setStageComplete] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [invalidCells, setInvalidCells] = useState<Position[]>([]);
  const [helpRemaining, setHelpRemaining] = useState(MAX_HELP);
  const [hintCells, setHintCells] = useState<Position[]>([]);
  const [showAddRowsHint, setShowAddRowsHint] = useState(false);

  // Track when no matches became available for add rows hint
  const noMatchesTimerRef = useRef<number | null>(null);

  // Check for board cleared and show completion modal
  useEffect(() => {
    if (isBoardCleared(board) && !stageComplete) {
      setStageComplete(true);
      setSelectedCell(null);
      playStageCompleteSound();
    }
  }, [board, stageComplete]);

  // Check for game over (no valid matches and no add rows remaining)
  useEffect(() => {
    // Don't check during animations or if already game over/stage complete
    if (clearingRows.length > 0 || gameOver || stageComplete) return;
    // Don't check if board is cleared
    if (isBoardCleared(board)) return;

    // Game over if no valid matches and can't add more rows
    if (!hasAnyValidMatch(board) && addRowsRemaining === 0) {
      setGameOver(true);
      setSelectedCell(null);
    }
  }, [board, addRowsRemaining, clearingRows.length, gameOver, stageComplete]);

  // Show add rows hint when stuck for 30 seconds
  useEffect(() => {
    // Clear any existing timer
    if (noMatchesTimerRef.current) {
      clearTimeout(noMatchesTimerRef.current);
      noMatchesTimerRef.current = null;
    }

    // Reset hint when conditions change
    setShowAddRowsHint(false);

    // Don't show hint if game is over, stage complete, or can't add rows
    if (gameOver || stageComplete || addRowsRemaining === 0) return;
    // Don't show if board is cleared
    if (isBoardCleared(board)) return;
    // Don't show if there are valid matches
    if (hasAnyValidMatch(board)) return;

    // No valid matches - start timer
    noMatchesTimerRef.current = window.setTimeout(() => {
      setShowAddRowsHint(true);
    }, ADD_ROWS_HINT_DELAY_MS);

    return () => {
      if (noMatchesTimerRef.current) {
        clearTimeout(noMatchesTimerRef.current);
      }
    };
  }, [board, addRowsRemaining, gameOver, stageComplete]);

  // Handle help button - show a valid pair
  const handleHelp = useCallback(() => {
    if (helpRemaining <= 0) return;

    const pair = findValidPair(board);
    if (!pair) {
      // No pairs available - hint to use Add Rows instead
      if (addRowsRemaining > 0) {
        setShowAddRowsHint(true);
      }
      return;
    }

    setHelpRemaining((h) => h - 1);
    setHintCells(pair);
    setSelectedCell(null);

    setTimeout(() => {
      setHintCells([]);
    }, HINT_ANIMATION_MS);
  }, [board, helpRemaining, addRowsRemaining]);

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
        } else {
          // Invalid match - show feedback
          playInvalidMatchSound();
          setInvalidCells([selectedCell, position]);
          setTimeout(() => {
            setInvalidCells([]);
          }, INVALID_ANIMATION_MS);
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
    setShowAddRowsHint(false);
  }, [addRowsRemaining, stage]);

  const handleNewGame = useCallback(() => {
    setStage(1);
    setBoard(generateBoard({ rows: INITIAL_ROWS, cols: COLS, stage: 1 }));
    setScore(0);
    setSelectedCell(null);
    setAddRowsRemaining(MAX_ADD_ROWS);
    setStageComplete(false);
    setGameOver(false);
    setHelpRemaining(MAX_HELP);
    setShowAddRowsHint(false);
    playGameStartSound();
  }, []);

  return {
    board,
    score,
    selectedCell,
    stage,
    stageComplete,
    gameOver,
    addRowsRemaining,
    clearingRows,
    invalidCells,
    hintCells,
    helpRemaining,
    showAddRowsHint,
    handleCellClick,
    handleAddRows,
    handleNewGame,
    handleContinue,
    handleHelp,
  };
}
