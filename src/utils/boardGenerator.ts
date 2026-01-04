import { Board, Cell, Position } from '../types';
import { hasValidPath, PathOptions } from './gameLogic';

/** Path options for generation - restrict diagonals to adjacent rows for row-removal safety */
const GENERATION_PATH_OPTIONS: PathOptions = { maxDiagonalDistance: 1 };

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

/**
 * Generate a matching pair that balances variety with minimizing adjacent matches
 */
function generateBestPair(
  board: Board,
  pos1: Position,
  pos2: Position
): [number, number] {
  // All possible matching pairs - shuffle for variety
  const allPairs: [number, number][] = shuffle([
    [1, 9], [9, 1], [2, 8], [8, 2], [3, 7], [7, 3], [4, 6], [6, 4], [5, 5],
    [1, 1], [2, 2], [3, 3], [4, 4], [6, 6], [7, 7], [8, 8], [9, 9],
  ]);

  // Collect candidates with their scores
  const candidates: Array<{ pair: [number, number]; score: number }> = [];

  for (const [val1, val2] of allPairs) {
    const score1 = countAdjacentMatches(board, pos1, val1);
    const score2 = countAdjacentMatches(board, pos2, val2);
    candidates.push({ pair: [val1, val2], score: score1 + score2 });

    // Also try swapped
    const score1Swap = countAdjacentMatches(board, pos1, val2);
    const score2Swap = countAdjacentMatches(board, pos2, val1);
    candidates.push({ pair: [val2, val1], score: score1Swap + score2Swap });
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
 * Get all positions on the board
 */
function getAllPositions(rows: number, cols: number): Position[] {
  const positions: Position[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
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
 * Calculate Manhattan distance between two positions in 1D (wrap-around) space
 */
function getLinearDistance(a: Position, b: Position, cols: number): number {
  const aIdx = a.row * cols + a.col;
  const bIdx = b.row * cols + b.col;
  return Math.abs(aIdx - bIdx);
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
 * Find a matchable position based on difficulty settings.
 * For harder difficulties, prefers positions that are farther away.
 */
function findMatchablePositionWithDifficulty(
  board: Board,
  target: Position,
  candidates: Position[],
  stage: number,
  pairIndex: number,
  totalPairs: number
): Position | null {
  const cols = board[0].length;
  const rows = board.length;
  const totalCells = rows * cols;
  const config = getDifficultyConfig(stage);

  // Calculate progress through board generation (0 = start, 1 = end)
  const progress = pairIndex / totalPairs;

  // Reduce distance requirements as board fills up (after 60% full, start relaxing)
  const fillFactor = progress > 0.6 ? (progress - 0.6) / 0.4 : 0; // 0 to 1 for last 40%
  const relaxFactor = 1 - fillFactor * 0.9; // Reduce requirements by up to 90%

  // For hard mode: early pairs should be far apart, later pairs can be closer
  // This creates "buried" pairs that need clearing first
  const effectiveMinRatio = config.preferFar
    ? config.minDistanceRatio * (1 - progress * 0.8) * relaxFactor
    : config.minDistanceRatio * relaxFactor;
  const effectiveMaxRatio = config.preferFar
    ? config.maxDistanceRatio * (1 - progress * 0.5)
    : config.maxDistanceRatio;

  const minDistance = Math.floor(totalCells * effectiveMinRatio);
  const maxDistance = Math.floor(totalCells * effectiveMaxRatio);

  // Filter and sort candidates by distance preference
  const validCandidates = candidates
    .filter((c) => !(c.row === target.row && c.col === target.col))
    .map((c) => ({
      pos: c,
      distance: getLinearDistance(target, c, cols),
    }))
    .filter((c) => c.distance >= minDistance);

  // Sort by distance (prefer within target range, with some randomness)
  validCandidates.sort((a, b) => {
    const aInRange = a.distance <= maxDistance;
    const bInRange = b.distance <= maxDistance;

    if (aInRange && !bInRange) return -1;
    if (!aInRange && bInRange) return 1;

    // Within same category, prefer based on difficulty
    if (config.preferFar) {
      return b.distance - a.distance; // Farther first
    } else {
      return a.distance - b.distance; // Closer first
    }
  });

  // Add randomness by shuffling top candidates
  const topCount = Math.min(10, validCandidates.length);
  const topCandidates = shuffle(validCandidates.slice(0, topCount));
  const restCandidates = validCandidates.slice(topCount);
  const orderedCandidates = [...topCandidates, ...restCandidates];

  // Find first valid candidate with clear path (restrict diagonals for row-removal safety)
  for (const { pos } of orderedCandidates) {
    if (hasValidPath(board, target, pos, GENERATION_PATH_OPTIONS)) {
      return pos;
    }
  }

  // Fallback: try ANY candidate with valid path, preferring farther ones
  const fallbackCandidates = candidates
    .filter((c) => !(c.row === target.row && c.col === target.col))
    .map((c) => ({ pos: c, distance: getLinearDistance(target, c, cols) }))
    .sort((a, b) => b.distance - a.distance); // Farther first

  for (const { pos } of fallbackCandidates) {
    if (hasValidPath(board, target, pos, GENERATION_PATH_OPTIONS)) {
      return pos;
    }
  }

  // Last resort: try immediate neighbors (adjacent in grid, not linear)
  const immediateNeighbors = [
    { row: target.row - 1, col: target.col },
    { row: target.row + 1, col: target.col },
    { row: target.row, col: target.col - 1 },
    { row: target.row, col: target.col + 1 },
  ];

  for (const neighbor of immediateNeighbors) {
    const found = candidates.find(c => c.row === neighbor.row && c.col === neighbor.col);
    if (found && hasValidPath(board, target, found, GENERATION_PATH_OPTIONS)) {
      return found;
    }
  }

  return null;
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
  } = options;

  const totalCells = rows * cols;
  if (totalCells % 2 !== 0) {
    throw new Error('Board must have even number of cells');
  }

  // Try the difficulty-based algorithm
  for (let attempt = 0; attempt < 50; attempt++) {
    const result = tryGenerateSolvableBoard(rows, cols, stage);
    if (result) return result;
  }

  // Fallback: generate pairs in adjacent positions (always solvable)
  return generateAdjacentPairsBoard(rows, cols);
}

/**
 * Try to generate a solvable board with difficulty-based pair placement
 */
function tryGenerateSolvableBoard(
  rows: number,
  cols: number,
  stage: number
): Board | null {
  const board = createEmptyBoard(rows, cols);
  let available = getAllPositions(rows, cols);
  // Shuffle but bias towards keeping positions that preserve connectivity
  // Start with random shuffle, the algorithm will still prefer distant positions
  available = shuffle(available);

  const totalPairs = available.length / 2;
  let pairIndex = 0;

  while (available.length >= 2) {
    const pos1 = available.shift()!;
    const pos2 = findMatchablePositionWithDifficulty(
      board,
      pos1,
      available,
      stage,
      pairIndex,
      totalPairs
    );

    if (!pos2) {
      return null; // Failed, try again
    }

    available = available.filter(
      (p) => !(p.row === pos2.row && p.col === pos2.col)
    );

    // Generate values that minimize accidental adjacent matches
    const [val1, val2] = generateBestPair(board, pos1, pos2);
    board[pos1.row][pos1.col].value = val1;
    board[pos2.row][pos2.col].value = val2;

    pairIndex++;
  }

  return board;
}

/**
 * Generate a board with pairs placed at fixed offset (guaranteed solvable via wrap-around).
 * Pairs are placed with a stride of half the board size for distance.
 */
function generateAdjacentPairsBoard(rows: number, cols: number): Board {
  const board = createEmptyBoard(rows, cols);
  const positions = getAllPositions(rows, cols);
  const halfSize = positions.length / 2;

  // Pair position i with position i + halfSize (opposite side of board)
  // This ensures pairs are far apart but still have valid wrap-around paths
  for (let i = 0; i < halfSize; i++) {
    const pos1 = positions[i];
    const pos2 = positions[i + halfSize];

    // Use generateBestPair to minimize accidental adjacent matches
    const [bestVal1, bestVal2] = generateBestPair(board, pos1, pos2);
    board[pos1.row][pos1.col].value = bestVal1;
    board[pos2.row][pos2.col].value = bestVal2;
  }

  return board;
}

/**
 * Add rows that can be matched with existing board content.
 * New rows are generated as matchable pairs among themselves.
 */
export function addRows(
  board: Board,
  count: number = 4,
  cols: number = COLS,
  stage: number = 1
): Board {
  const newBoard = board.map((row) => [...row]);
  const startRow = board.length;

  // Create empty rows first
  for (let i = 0; i < count; i++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      rowCells.push({
        value: null,
        position: { row: startRow + i, col },
      });
    }
    newBoard.push(rowCells);
  }

  // Get positions for new rows only
  let newPositions: Position[] = [];
  for (let row = startRow; row < startRow + count; row++) {
    for (let col = 0; col < cols; col++) {
      newPositions.push({ row, col });
    }
  }
  newPositions = shuffle(newPositions);

  const totalPairs = newPositions.length / 2;
  let pairIndex = 0;

  // Fill new rows with matchable pairs using difficulty settings
  while (newPositions.length >= 2) {
    const pos1 = newPositions.shift()!;
    const pos2 = findMatchablePositionWithDifficulty(
      newBoard,
      pos1,
      newPositions,
      stage,
      pairIndex,
      totalPairs
    );

    if (pos2) {
      newPositions = newPositions.filter(
        (p) => !(p.row === pos2.row && p.col === pos2.col)
      );
      // Generate values that minimize accidental adjacent matches
      const [val1, val2] = generateBestPair(newBoard, pos1, pos2);
      newBoard[pos1.row][pos1.col].value = val1;
      newBoard[pos2.row][pos2.col].value = val2;
      pairIndex++;
    } else {
      // Fallback: just place a random digit
      newBoard[pos1.row][pos1.col].value = Math.floor(Math.random() * 9) + 1;
    }
  }

  // Handle any remaining single position
  if (newPositions.length === 1) {
    const pos = newPositions[0];
    newBoard[pos.row][pos.col].value = Math.floor(Math.random() * 9) + 1;
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
