import { useState, useCallback, useEffect, useRef } from 'react';
import { Board, Position } from '../types';
import { generateBoard, addRows } from '../utils/boardGenerator';
import { canMatch, removeMatch, calculateScore, isBoardCleared, removeClearedRows, getClearedRowIndices, getMatchDistance, hasAnyValidMatch, findValidPair } from '../utils/gameLogic';
import { playMatchSound, playRowClearSound, playStageCompleteSound, playInvalidMatchSound, playGameStartSound, playAddRowsSound, playHintSound } from '../utils/sounds';

const ROW_CLEAR_ANIMATION_MS = 400;
const INVALID_ANIMATION_MS = 400;
const HINT_ANIMATION_MS = 1500;
const ADD_ROWS_HINT_DELAY_MS = 30 * 1000;
const NEW_ROWS_GLOW_MS = 2000;

const INITIAL_ROWS = 10;
const COLS = 9;
const ROWS_TO_ADD = 4;
const MAX_ADD_ROWS = 4;
const MAX_HELP = 3;
const MAX_DIGIT_USES = 12;  // Each digit can be used at most N times per stage
const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Initial digit usage counts (all zeros) */
function createInitialDigitUsage(): Record<number, number> {
  return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
}

/** Get available digits (those not exhausted) */
function getAvailableDigits(usage: Record<number, number>): number[] {
  return ALL_DIGITS.filter(d => usage[d] < MAX_DIGIT_USES);
}

interface UseGameOptions {
  soundEnabled?: boolean;
  animationsEnabled?: boolean;
}

export function useGame(options: UseGameOptions = {}) {
  const { soundEnabled = true, animationsEnabled = true } = options;
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
  const [newCells, setNewCells] = useState<Position[]>([]);
  const [digitUsage, setDigitUsage] = useState<Record<number, number>>(createInitialDigitUsage);

  // Track when no matches became available for add rows hint
  const noMatchesTimerRef = useRef<number | null>(null);

  // Track glow timeouts per cell (key: "row-col")
  const glowTimeoutsRef = useRef<Map<string, number>>(new Map());

  // Helper to create a cell key for the timeout map
  const cellKey = (pos: Position) => `${pos.row}-${pos.col}`;

  // Helper to add glow to specific cells with independent timers
  const addGlowToCells = useCallback((cells: Position[]) => {
    if (!animationsEnabled) return;

    // Add new cells to the glow set (avoid duplicates)
    setNewCells(prev => {
      const existingKeys = new Set(prev.map(p => cellKey(p)));
      const newUnique = cells.filter(c => !existingKeys.has(cellKey(c)));
      return [...prev, ...newUnique];
    });

    // Set individual timeouts for each cell
    cells.forEach(pos => {
      const key = cellKey(pos);
      // Clear any existing timeout for this cell
      const existing = glowTimeoutsRef.current.get(key);
      if (existing) clearTimeout(existing);

      const timeoutId = window.setTimeout(() => {
        setNewCells(prev => prev.filter(p => cellKey(p) !== key));
        glowTimeoutsRef.current.delete(key);
      }, NEW_ROWS_GLOW_MS);
      glowTimeoutsRef.current.set(key, timeoutId);
    });
  }, [animationsEnabled]);

  // Glow effect for initial board on mount
  useEffect(() => {
    const allCells: Position[] = [];
    for (let row = 0; row < INITIAL_ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        allCells.push({ row, col });
      }
    }
    addGlowToCells(allCells);
  }, [addGlowToCells]);

  // Check for board cleared and show completion modal
  useEffect(() => {
    if (isBoardCleared(board) && !stageComplete) {
      setStageComplete(true);
      setSelectedCell(null);
      if (soundEnabled) playStageCompleteSound();
    }
  }, [board, stageComplete, soundEnabled]);

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

    if (soundEnabled) playHintSound();

    setHelpRemaining((h) => h - 1);
    setHintCells(pair);
    setSelectedCell(null);

    setTimeout(() => {
      setHintCells([]);
    }, HINT_ANIMATION_MS);
  }, [board, helpRemaining, addRowsRemaining, soundEnabled]);

  // Handle continuing to next stage
  const handleContinue = useCallback(() => {
    // Clear any existing glow timeouts
    glowTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    glowTimeoutsRef.current.clear();
    setNewCells([]);

    const nextStage = stage + 1;
    setStage(nextStage);
    setDigitUsage(createInitialDigitUsage());  // Reset digit usage for new stage
    setBoard(generateBoard({ rows: INITIAL_ROWS, cols: COLS, stage: nextStage }));
    setAddRowsRemaining(MAX_ADD_ROWS);
    setStageComplete(false);

    // Glow effect for all new cells
    const allCells: Position[] = [];
    for (let row = 0; row < INITIAL_ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        allCells.push({ row, col });
      }
    }
    addGlowToCells(allCells);
  }, [stage, addGlowToCells]);

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

          // Track digit usage - increment count for both matched digits
          const digit1 = board[selectedCell.row][selectedCell.col].value!;
          const digit2 = board[position.row][position.col].value!;
          setDigitUsage(prev => ({
            ...prev,
            [digit1]: prev[digit1] + 1,
            [digit2]: prev[digit2] + 1,
          }));

          // Play match sound (pitch increases with distance)
          if (soundEnabled) playMatchSound(distance);

          // Check for cleared rows
          const clearedIndices = getClearedRowIndices(boardAfterMatch);
          if (clearedIndices.length > 0) {
            // Show clearing animation first
            setBoard(boardAfterMatch);
            setClearingRows(clearedIndices);

            // Play row clear sound after a short delay
            if (soundEnabled) setTimeout(() => playRowClearSound(), 100);

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
          if (soundEnabled) playInvalidMatchSound();
          setInvalidCells([selectedCell, position]);
          setTimeout(() => {
            setInvalidCells([]);
          }, INVALID_ANIMATION_MS);
        }
        setSelectedCell(null);
      }
    },
    [board, selectedCell, soundEnabled]
  );

  const handleAddRows = useCallback(() => {
    if (addRowsRemaining <= 0) return;

    if (soundEnabled) playAddRowsSound();

    const availableDigits = getAvailableDigits(digitUsage);
    setBoard((b) => {
      const newBoard = addRows(b, ROWS_TO_ADD, COLS, stage, availableDigits);

      const cellsToGlow: Position[] = [];

      // Check if trailing cells in the last row were filled
      if (b.length > 0 && newBoard.length >= b.length) {
        const lastRowIdx = b.length - 1;
        const oldLastRow = b[lastRowIdx];
        const newLastRow = newBoard[lastRowIdx];

        // Add any newly filled cells in the last row to glow
        oldLastRow.forEach((cell, col) => {
          if (cell.value === null && newLastRow[col]?.value !== null) {
            cellsToGlow.push({ row: lastRowIdx, col });
          }
        });
      }

      // Track cells in newly added rows
      const addedRows = newBoard.length - b.length;
      if (addedRows > 0) {
        for (let rowIdx = b.length; rowIdx < newBoard.length; rowIdx++) {
          newBoard[rowIdx].forEach((cell, col) => {
            if (cell.value !== null) {
              cellsToGlow.push({ row: rowIdx, col });
            }
          });
        }
      }

      if (cellsToGlow.length > 0) {
        addGlowToCells(cellsToGlow);
      }

      return newBoard;
    });
    setAddRowsRemaining((r) => r - 1);
    setShowAddRowsHint(false);
  }, [addRowsRemaining, stage, addGlowToCells, soundEnabled, digitUsage]);

  const handleNewGame = useCallback(() => {
    // Clear any existing glow timeouts
    glowTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    glowTimeoutsRef.current.clear();
    setNewCells([]);

    setStage(1);
    setDigitUsage(createInitialDigitUsage());  // Reset digit usage for new game
    setBoard(generateBoard({ rows: INITIAL_ROWS, cols: COLS, stage: 1 }));
    setScore(0);
    setSelectedCell(null);
    setAddRowsRemaining(MAX_ADD_ROWS);
    setStageComplete(false);
    setGameOver(false);
    setHelpRemaining(MAX_HELP);
    setShowAddRowsHint(false);
    if (soundEnabled) playGameStartSound();

    // Glow effect for all new cells
    const allCells: Position[] = [];
    for (let row = 0; row < INITIAL_ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        allCells.push({ row, col });
      }
    }
    addGlowToCells(allCells);
  }, [addGlowToCells, soundEnabled]);

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
    newCells,
    handleCellClick,
    handleAddRows,
    handleNewGame,
    handleContinue,
    handleHelp,
  };
}
