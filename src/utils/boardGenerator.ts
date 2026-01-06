import { Board, Cell, Position } from '../types';
import { hasValidPath, PathOptions, findValidPair, removeMatch, isBoardCleared } from './gameLogic';

/** Path options for addRows - restrict diagonals to adjacent rows for row-removal safety */
const ADDROWS_PATH_OPTIONS: PathOptions = { maxDiagonalDistance: 1 };

const COLS = 9;
const ROWS = 10;

/**
 * Get difficulty factor based on stage (0-1 range).
 * Stage 1 = 0.1 (easy), Stage 10+ = 1.0 (hard)
 */
export function getDifficultyFactor(stage: number): number {
  return Math.min(1, Math.max(0.1, stage / 10));
}

export interface GeneratorOptions {
  rows?: number;
  cols?: number;
  stage?: number;
  availableDigits?: number[];  // Digits that can be used (default: 1-9)
}

/**
 * Count how many adjacent matches a value would create at a position
 */
function countAdjacentMatches(
  board: Board,
  pos: Position,
  value: number
): number {
  const rows = board.length;
  const cols = board[0].length;
  let count = 0;

  // Check all 8 neighbors + wrap-around adjacency
  const neighbors: Position[] = [
    { row: pos.row - 1, col: pos.col - 1 },
    { row: pos.row - 1, col: pos.col },
    { row: pos.row - 1, col: pos.col + 1 },
    { row: pos.row, col: pos.col - 1 },
    { row: pos.row, col: pos.col + 1 },
    { row: pos.row + 1, col: pos.col - 1 },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row + 1, col: pos.col + 1 },
  ];

  // Add wrap-around neighbors
  const linearIdx = pos.row * cols + pos.col;
  if (linearIdx > 0) {
    const prevIdx = linearIdx - 1;
    neighbors.push({ row: Math.floor(prevIdx / cols), col: prevIdx % cols });
  }
  if (linearIdx < rows * cols - 1) {
    const nextIdx = linearIdx + 1;
    neighbors.push({ row: Math.floor(nextIdx / cols), col: nextIdx % cols });
  }

  for (const neighbor of neighbors) {
    if (neighbor.row < 0 || neighbor.row >= rows) continue;
    if (neighbor.col < 0 || neighbor.col >= cols) continue;

    const neighborValue = board[neighbor.row][neighbor.col].value;
    if (neighborValue === null) continue;

    if (neighborValue === value || neighborValue + value === 10) {
      count++;
    }
  }

  return count;
}

/** All digits 1-9 */
const ALL_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Generate all valid matching pairs from available digits.
 * A valid pair is either same digit or sums to 10.
 */
function getValidPairs(availableDigits: number[]): [number, number][] {
  const pairs: [number, number][] = [];
  const digitSet = new Set(availableDigits);

  for (const d1 of availableDigits) {
    // Same digit pairs
    pairs.push([d1, d1]);

    // Sum-to-10 pairs
    const complement = 10 - d1;
    if (complement !== d1 && complement >= 1 && complement <= 9 && digitSet.has(complement)) {
      pairs.push([d1, complement]);
    }
  }

  return pairs;
}

/**
 * Generate a matching pair that balances variety with minimizing adjacent matches.
 * Only uses digits from availableDigits.
 */
function generateBestPair(
  board: Board,
  pos1: Position,
  pos2: Position,
  availableDigits: number[] = ALL_DIGITS
): [number, number] {
  // Get all valid matching pairs from available digits, then shuffle for variety
  const allPairs = shuffle(getValidPairs(availableDigits));

  if (allPairs.length === 0) {
    // Fallback if no pairs available (shouldn't happen in normal play)
    throw new Error('No available digit pairs');
  }

  // Collect candidates with their scores
  const candidates: Array<{ pair: [number, number]; score: number }> = [];

  for (const [val1, val2] of allPairs) {
    const score1 = countAdjacentMatches(board, pos1, val1);
    const score2 = countAdjacentMatches(board, pos2, val2);
    candidates.push({ pair: [val1, val2], score: score1 + score2 });

    // Also try swapped (if different values)
    if (val1 !== val2) {
      const score1Swap = countAdjacentMatches(board, pos1, val2);
      const score2Swap = countAdjacentMatches(board, pos2, val1);
      candidates.push({ pair: [val2, val1], score: score1Swap + score2Swap });
    }
  }

  // Sort by score (lower is better)
  candidates.sort((a, b) => a.score - b.score);

  // Pick from the best candidates with some randomness
  // 80% chance to pick best, 20% chance to pick from top 5
  if (Math.random() < 0.8 || candidates.length < 5) {
    return candidates[0].pair;
  } else {
    const idx = Math.floor(Math.random() * 5);
    return candidates[idx].pair;
  }
}

/**
 * Create an empty board with null values
 */
function createEmptyBoard(rows: number, cols: number): Board {
  const board: Board = [];
  for (let row = 0; row < rows; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      rowCells.push({
        value: null,
        position: { row, col },
      });
    }
    board.push(rowCells);
  }
  return board;
}

/**
 * Shuffle array in place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get difficulty configuration based on stage.
 * Interpolates between easy (stage 1) and hard (stage 10+) settings.
 */
function getDifficultyConfig(stage: number) {
  const factor = getDifficultyFactor(stage);

  // Easy (factor=0.1): minDistanceRatio=0, maxDistanceRatio=0.25, preferFar=false
  // Hard (factor=1.0): minDistanceRatio=0.04, maxDistanceRatio=0.7, preferFar=true

  // Interpolate between easy and hard settings
  const minDistanceRatio = 0.04 * (factor - 0.1) / 0.9;  // 0 at stage 1, 0.04 at stage 10
  const maxDistanceRatio = 0.25 + 0.45 * (factor - 0.1) / 0.9;  // 0.25 at stage 1, 0.7 at stage 10
  const preferFar = factor > 0.5;  // Switch at stage 5

  return { minDistanceRatio, maxDistanceRatio, preferFar };
}

/**
 * Generate a solvable board with configurable difficulty.
 *
 * Difficulty is based on stage number (1-10+):
 * - Stage 1: pairs are mostly adjacent, can be matched quickly
 * - Stage 10+: pairs are far apart, requiring clearing other cells first
 */
export function generateBoard(options: GeneratorOptions = {}): Board {
  const {
    rows = ROWS,
    cols = COLS,
    stage = 1,
    availableDigits = ALL_DIGITS,
  } = options;

  const totalCells = rows * cols;
  if (totalCells % 2 !== 0) {
    throw new Error('Board must have even number of cells');
  }

  // Ensure we have valid pairs available
  const validPairs = getValidPairs(availableDigits);
  if (validPairs.length === 0) {
    throw new Error('No valid digit pairs available');
  }

  // Try the difficulty-based algorithm with backtracking
  for (let attempt = 0; attempt < 50; attempt++) {
    const result = tryGenerateSolvableBoard(rows, cols, stage, availableDigits);
    if (result) {
      return result;
    }
  }

  // Fallback: try each preceding stage (from highest to lowest) to maintain difficulty
  for (let fallbackStage = stage - 1; fallbackStage >= 1; fallbackStage--) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const result = tryGenerateSolvableBoard(rows, cols, fallbackStage, availableDigits);
      if (result) {
        return result;
      }
    }
  }

  // Last resort fallback: generate pairs in adjacent positions (always solvable)
  return generateAdjacentPairsBoard(rows, cols, availableDigits);
}

/**
 * Try to generate a solvable board with distance variety.
 *
 * LINEAR SNAKE FILLING:
 * Fill positions in snake order (row by row, alternating direction).
 * For each pair, pick position 1 from front, position 2 with some gap.
 * This guarantees paths stay clear because we fill linearly.
 *
 * Solvability guaranteed because:
 * - Pairs are placed in order along the snake
 * - Path between pair members only crosses already-placed cells
 * - Solution order = reverse of placement order
 */
function tryGenerateSolvableBoard(
  rows: number,
  cols: number,
  stage: number,
  availableDigits: number[] = ALL_DIGITS
): Board | null {
  const board = createEmptyBoard(rows, cols);
  const totalCells = rows * cols;
  const totalPairs = totalCells / 2;
  const config = getDifficultyConfig(stage);

  // Create snake-ordered positions
  // Row 0: left-to-right, Row 1: right-to-left, etc.
  const snakePositions: Position[] = [];
  for (let row = 0; row < rows; row++) {
    if (row % 2 === 0) {
      for (let col = 0; col < cols; col++) {
        snakePositions.push({ row, col });
      }
    } else {
      for (let col = cols - 1; col >= 0; col--) {
        snakePositions.push({ row, col });
      }
    }
  }

  // Remaining positions (indices into snakePositions that haven't been used)
  const remaining: number[] = [];
  for (let i = 0; i < snakePositions.length; i++) {
    remaining.push(i);
  }

  // Place pairs
  for (let pairIdx = 0; pairIdx < totalPairs; pairIdx++) {
    if (remaining.length < 2) {
      return null;
    }

    const progress = pairIdx / totalPairs;

    // Determine target gap based on difficulty
    let maxGap: number;
    if (progress < 0.5) {
      maxGap = config.preferFar
        ? Math.min(remaining.length - 1, 15)
        : Math.min(remaining.length - 1, 8);
    } else {
      const shrink = (progress - 0.5) * 2;
      maxGap = Math.max(1, Math.floor((1 - shrink) * 5));
    }

    // Try different positions for pos1 if needed (backtracking)
    let foundPair = false;
    const maxPos1Tries = Math.min(5, remaining.length);

    for (let pos1Try = 0; pos1Try < maxPos1Tries && !foundPair; pos1Try++) {
      const idx1InRemaining = pos1Try;
      const snakeIdx1 = remaining[idx1InRemaining];
      const pos1 = snakePositions[snakeIdx1];

      // Find a valid position 2 with path to position 1
      let bestIdx2 = -1;

      // Prefer gaps in the target range - try from highest to lowest
      const targetGap = Math.min(maxGap, remaining.length - 1);

      for (let tryGap = targetGap; tryGap >= 1; tryGap--) {
        const idx2 = idx1InRemaining + tryGap;
        if (idx2 >= remaining.length) continue;

        const pos2 = snakePositions[remaining[idx2]];
        if (hasValidPath(board, pos1, pos2)) {
          bestIdx2 = idx2;
          break;
        }
      }

      // If no path found with preferred gap, try ANY valid pair
      if (bestIdx2 < 0) {
        for (let idx2 = 0; idx2 < remaining.length; idx2++) {
          if (idx2 === idx1InRemaining) continue;
          const pos2 = snakePositions[remaining[idx2]];
          if (hasValidPath(board, pos1, pos2)) {
            bestIdx2 = idx2;
            break;
          }
        }
      }

      if (bestIdx2 >= 0) {
        const snakeIdx2 = remaining[bestIdx2];
        const pos2 = snakePositions[snakeIdx2];

        // Place the pair
        const [val1, val2] = generateBestPair(board, pos1, pos2, availableDigits);
        board[pos1.row][pos1.col].value = val1;
        board[pos2.row][pos2.col].value = val2;

        // Remove used indices from remaining (remove higher index first)
        if (bestIdx2 > idx1InRemaining) {
          remaining.splice(bestIdx2, 1);
          remaining.splice(idx1InRemaining, 1);
        } else {
          remaining.splice(idx1InRemaining, 1);
          remaining.splice(bestIdx2, 1);
        }

        foundPair = true;
      }
    }

    if (!foundPair) {
      // No valid pair found even with backtracking - stuck
      return null;
    }
  }

  // Verify solvability before returning
  if (!verifyBoardSolvable(board)) {
    return null;
  }

  return board;
}

/**
 * Verify that a board can be completely solved
 */
function verifyBoardSolvable(board: Board): boolean {
  let currentBoard = board;
  let moves = 0;
  const maxMoves = 100;

  while (moves < maxMoves) {
    if (isBoardCleared(currentBoard)) return true;
    const pair = findValidPair(currentBoard);
    if (!pair) return false;
    currentBoard = removeMatch(currentBoard, pair[0], pair[1]);
    moves++;
  }

  return false;
}

/**
 * Generate a board with ADJACENT pairs (guaranteed solvable).
 * Pairs cells in linear order (wrap-around), so each pair is always adjacent.
 * This is trivially solvable because adjacent cells always have a clear path.
 */
function generateAdjacentPairsBoard(
  rows: number,
  cols: number,
  availableDigits: number[] = ALL_DIGITS
): Board {
  const board = createEmptyBoard(rows, cols);
  const totalCells = rows * cols;
  const validPairs = getValidPairs(availableDigits);

  // Pair cells in linear order: 0-1, 2-3, 4-5, etc.
  // Linear index i maps to (row: floor(i/cols), col: i%cols)
  for (let i = 0; i < totalCells; i += 2) {
    const pos1 = { row: Math.floor(i / cols), col: i % cols };
    const pos2 = { row: Math.floor((i + 1) / cols), col: (i + 1) % cols };

    // Pick a random valid pair from available digits
    const [val1, val2] = validPairs[Math.floor(Math.random() * validPairs.length)];

    board[pos1.row][pos1.col].value = val1;
    board[pos2.row][pos2.col].value = val2;
  }

  return board;
}

/**
 * Check if a cell has any valid match on the board
 */
function hasValidMatch(board: Board, pos: Position): boolean {
  const cell = board[pos.row][pos.col];
  if (cell.value === null) return false;

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      if (row === pos.row && col === pos.col) continue;

      const other = board[row][col];
      if (other.value === null) continue;

      // Check if values match (same or sum to 10)
      if (cell.value === other.value || cell.value + other.value === 10) {
        // Check if there's a valid path (restrict diagonals to adjacent for row-removal safety)
        if (hasValidPath(board, pos, { row, col }, ADDROWS_PATH_OPTIONS)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Add rows that can be matched with existing board content.
 * New cells are generated to help rescue stuck cells on the board.
 *
 * The number of new cells added equals the number of remaining cells on the board,
 * capped at count * cols (default 36 cells = 4 rows).
 * This may result in partial rows (e.g., 2 cells remaining = 1 row with 2 cells).
 */
export function addRows(
  board: Board,
  count: number = 4,
  cols: number = COLS,
  _stage: number = 1,
  availableDigits: number[] = ALL_DIGITS
): Board {
  const newBoard = board.map((row) => [...row]);
  const startRow = board.length;
  const boardCols = board[0]?.length || cols;
  const availableSet = new Set(availableDigits);

  // Count remaining cells on the board
  const remainingCells = board.flat().filter(cell => cell.value !== null).length;

  // If board is already cleared, return unchanged
  if (remainingCells === 0) {
    return newBoard;
  }

  // If no available digits, return unchanged
  if (availableDigits.length === 0) {
    return newBoard;
  }

  // Add exactly as many cells as there are remaining, capped at max (count * cols)
  const maxCells = count * boardCols;
  const totalNewCells = Math.min(remainingCells, maxCells);

  // Find stuck cells (cells with no valid match on current board)
  const stuckValues: number[] = [];
  for (let row = 0; row < startRow; row++) {
    for (let col = 0; col < boardCols; col++) {
      const value = board[row][col].value;
      if (value !== null && !hasValidMatch(board, { row, col })) {
        stuckValues.push(value);
      }
    }
  }

  // Build rescue pairs for stuck cells (only using available digits)
  const valuesToPlace: number[] = [];
  const shuffledStuck = shuffle(stuckValues);

  for (const value of shuffledStuck) {
    if (valuesToPlace.length >= totalNewCells) break;

    // Add a value that matches the stuck cell (if available)
    const complement = 10 - value;
    const canUseSame = availableSet.has(value);
    const canUseComplement = complement >= 1 && complement <= 9 && availableSet.has(complement);

    let rescueValue: number | null = null;
    if (canUseSame && canUseComplement) {
      rescueValue = Math.random() < 0.5 ? value : complement;
    } else if (canUseSame) {
      rescueValue = value;
    } else if (canUseComplement) {
      rescueValue = complement;
    }

    if (rescueValue === null) continue; // Can't rescue this stuck cell

    valuesToPlace.push(rescueValue);

    if (valuesToPlace.length >= totalNewCells) break;

    // Add another value that matches the rescue value (ensures self-solvability)
    const pairComplement = 10 - rescueValue;
    const canPairSame = availableSet.has(rescueValue);
    const canPairComplement = pairComplement >= 1 && pairComplement <= 9 && availableSet.has(pairComplement);

    if (canPairSame && canPairComplement) {
      valuesToPlace.push(Math.random() < 0.5 ? rescueValue : pairComplement);
    } else if (canPairSame) {
      valuesToPlace.push(rescueValue);
    } else if (canPairComplement) {
      valuesToPlace.push(pairComplement);
    }
  }

  // Generate barrier cells (random matchable pairs from available digits) to fill remaining space
  const validPairs = getValidPairs(availableDigits);
  const barrierValues: number[] = [];
  while (valuesToPlace.length + barrierValues.length < totalNewCells - 1 && validPairs.length > 0) {
    const [val1, val2] = validPairs[Math.floor(Math.random() * validPairs.length)];
    barrierValues.push(val1, val2);
  }

  // Handle odd cell count edge case
  if (valuesToPlace.length + barrierValues.length < totalNewCells && availableDigits.length > 0) {
    barrierValues.push(availableDigits[Math.floor(Math.random() * availableDigits.length)]);
  }

  // Place barrier cells first (at start of new rows), then rescue cells
  // This makes rescue cells harder to reach - player must clear barriers first
  const shuffledBarriers = shuffle(barrierValues);
  const shuffledRescue = shuffle(valuesToPlace);
  const orderedValues = [...shuffledBarriers, ...shuffledRescue].slice(0, totalNewCells);

  // Add randomness so placement isn't predictable
  // Randomly swap ~30% of positions to break the strict barrier-then-rescue pattern
  for (let i = 0; i < orderedValues.length; i++) {
    if (Math.random() < 0.3) {
      const j = Math.floor(Math.random() * orderedValues.length);
      [orderedValues[i], orderedValues[j]] = [orderedValues[j], orderedValues[i]];
    }
  }

  let valueIdx = 0;

  // First, fill trailing empty cells in the last row (if any)
  // Trailing = null cells that come AFTER the last non-null cell in the row
  if (newBoard.length > 0) {
    const lastRow = newBoard[newBoard.length - 1];

    // Find the last non-null cell in the row
    let lastNonNullCol = -1;
    for (let col = boardCols - 1; col >= 0; col--) {
      if (lastRow[col].value !== null) {
        lastNonNullCol = col;
        break;
      }
    }

    // Only fill trailing nulls if there's at least one non-null cell
    // (i.e., trailing nulls are cells after lastNonNullCol)
    if (lastNonNullCol >= 0 && lastNonNullCol < boardCols - 1) {
      for (let col = lastNonNullCol + 1; col < boardCols && valueIdx < orderedValues.length; col++) {
        lastRow[col] = {
          value: orderedValues[valueIdx],
          position: { row: newBoard.length - 1, col },
        };
        valueIdx++;
      }
    }
  }

  // Calculate remaining cells to add as new rows
  const remainingToAdd = orderedValues.length - valueIdx;
  if (remainingToAdd > 0) {
    const newFullRows = Math.floor(remainingToAdd / boardCols);
    const newPartialCells = remainingToAdd % boardCols;

    // Add full rows
    for (let i = 0; i < newFullRows; i++) {
      const rowCells: Cell[] = [];
      const rowIndex = newBoard.length;
      for (let col = 0; col < boardCols; col++) {
        rowCells.push({
          value: orderedValues[valueIdx],
          position: { row: rowIndex, col },
        });
        valueIdx++;
      }
      newBoard.push(rowCells);
    }

    // Add partial row if needed
    if (newPartialCells > 0) {
      const rowCells: Cell[] = [];
      const rowIndex = newBoard.length;
      for (let col = 0; col < boardCols; col++) {
        if (col < newPartialCells) {
          rowCells.push({
            value: orderedValues[valueIdx],
            position: { row: rowIndex, col },
          });
          valueIdx++;
        } else {
          // Fill remaining cells with null
          rowCells.push({
            value: null,
            position: { row: rowIndex, col },
          });
        }
      }
      newBoard.push(rowCells);
    }
  }

  return newBoard;
}

// Keep createRow for backwards compatibility with tests
export function createRow(rowIndex: number, cols: number = COLS): Cell[] {
  const row: Cell[] = [];
  for (let col = 0; col < cols; col++) {
    row.push({
      value: Math.floor(Math.random() * 9) + 1,
      position: { row: rowIndex, col },
    });
  }
  return row;
}
