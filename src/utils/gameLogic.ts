import { Board, Position, Cell } from '../types';

/**
 * Check if two digits can be matched based on value rules:
 * - Same digit, OR
 * - Sum equals 10
 */
export function canMatchValues(a: number, b: number): boolean {
  return a === b || a + b === 10;
}

/**
 * Get cell at position, returns null if out of bounds
 */
function getCell(board: Board, pos: Position): Cell | null {
  if (pos.row < 0 || pos.row >= board.length) return null;
  if (pos.col < 0 || pos.col >= board[0].length) return null;
  return board[pos.row][pos.col];
}

/**
 * Check if path is clear between two positions on the same row
 */
function isHorizontalPathClear(board: Board, from: Position, to: Position): boolean {
  if (from.row !== to.row) return false;

  const minCol = Math.min(from.col, to.col);
  const maxCol = Math.max(from.col, to.col);

  for (let col = minCol + 1; col < maxCol; col++) {
    const cell = getCell(board, { row: from.row, col });
    if (cell && cell.value !== null) return false;
  }
  return true;
}

/**
 * Check if path is clear between two positions in the same column
 */
function isVerticalPathClear(board: Board, from: Position, to: Position): boolean {
  if (from.col !== to.col) return false;

  const minRow = Math.min(from.row, to.row);
  const maxRow = Math.max(from.row, to.row);

  for (let row = minRow + 1; row < maxRow; row++) {
    const cell = getCell(board, { row, col: from.col });
    if (cell && cell.value !== null) return false;
  }
  return true;
}

/**
 * Check if path is clear along a diagonal
 * @param maxDistance - Optional max row/col distance for diagonal (1 = adjacent only)
 */
function isDiagonalPathClear(board: Board, from: Position, to: Position, maxDistance?: number): boolean {
  const rowDiff = to.row - from.row;
  const colDiff = to.col - from.col;

  // Must be on a diagonal (same absolute difference)
  if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
  if (rowDiff === 0) return false; // Same cell or horizontal

  // Check max distance constraint (for generation with row-removal safety)
  if (maxDistance !== undefined && Math.abs(rowDiff) > maxDistance) return false;

  const rowStep = rowDiff > 0 ? 1 : -1;
  const colStep = colDiff > 0 ? 1 : -1;
  const steps = Math.abs(rowDiff);

  for (let i = 1; i < steps; i++) {
    const row = from.row + i * rowStep;
    const col = from.col + i * colStep;
    const cell = getCell(board, { row, col });
    if (cell && cell.value !== null) return false;
  }
  return true;
}

/**
 * Convert 2D position to 1D index (for horizontal wrap checking)
 */
function posToIndex(pos: Position, cols: number): number {
  return pos.row * cols + pos.col;
}

/**
 * Convert 1D index to 2D position
 */
function indexToPos(index: number, cols: number): Position {
  return {
    row: Math.floor(index / cols),
    col: index % cols,
  };
}

/**
 * Check if horizontal wrap path is clear (treating board as 1D array)
 * This allows matching across row boundaries
 */
function isHorizontalWrapPathClear(board: Board, from: Position, to: Position): boolean {
  const cols = board[0].length;
  const fromIdx = posToIndex(from, cols);
  const toIdx = posToIndex(to, cols);

  const minIdx = Math.min(fromIdx, toIdx);
  const maxIdx = Math.max(fromIdx, toIdx);

  for (let idx = minIdx + 1; idx < maxIdx; idx++) {
    const pos = indexToPos(idx, cols);
    const cell = getCell(board, pos);
    if (cell && cell.value !== null) return false;
  }
  return true;
}

export interface PathOptions {
  /** Max diagonal distance (1 = adjacent only). Used for row-removal-safe generation. */
  maxDiagonalDistance?: number;
}

/**
 * Check if there's a valid path between two positions
 */
export function hasValidPath(board: Board, from: Position, to: Position, options?: PathOptions): boolean {
  // Same position - no match
  if (from.row === to.row && from.col === to.col) return false;

  // Check horizontal (same row)
  if (from.row === to.row && isHorizontalPathClear(board, from, to)) {
    return true;
  }

  // Check vertical (same column)
  if (from.col === to.col && isVerticalPathClear(board, from, to)) {
    return true;
  }

  // Check diagonal (with optional distance restriction)
  if (isDiagonalPathClear(board, from, to, options?.maxDiagonalDistance)) {
    return true;
  }

  // Check horizontal wrap (1D traversal)
  if (isHorizontalWrapPathClear(board, from, to)) {
    return true;
  }

  return false;
}

/**
 * Check if two cells can be matched (both value and path rules)
 */
export function canMatch(board: Board, pos1: Position, pos2: Position): boolean {
  const cell1 = getCell(board, pos1);
  const cell2 = getCell(board, pos2);

  // Both cells must exist and have values
  if (!cell1 || !cell2) return false;
  if (cell1.value === null || cell2.value === null) return false;

  // Check value matching rules
  if (!canMatchValues(cell1.value, cell2.value)) return false;

  // Check path rules
  return hasValidPath(board, pos1, pos2);
}

/**
 * Remove matched cells from board (returns new board)
 */
export function removeMatch(board: Board, pos1: Position, pos2: Position): Board {
  return board.map((row, rowIdx) =>
    row.map((cell, colIdx) => {
      if (
        (rowIdx === pos1.row && colIdx === pos1.col) ||
        (rowIdx === pos2.row && colIdx === pos2.col)
      ) {
        return { ...cell, value: null };
      }
      return cell;
    })
  );
}

/**
 * Calculate the distance between two positions.
 * Uses the linear (1D wrap-around) distance for consistency with path rules.
 */
export function getMatchDistance(board: Board, pos1: Position, pos2: Position): number {
  const cols = board[0].length;
  const idx1 = posToIndex(pos1, cols);
  const idx2 = posToIndex(pos2, cols);
  // Distance is the number of cells between them (not including endpoints)
  return Math.abs(idx1 - idx2) - 1;
}

/**
 * Calculate score for a match.
 * Base score = sum of the two digits
 * Distance bonus = cells between * 2 (rewards clearing paths for distant matches)
 */
export function calculateScore(board: Board, pos1: Position, pos2: Position): number {
  const cell1 = getCell(board, pos1);
  const cell2 = getCell(board, pos2);

  if (!cell1?.value || !cell2?.value) return 0;

  const baseScore = cell1.value + cell2.value;
  const distance = getMatchDistance(board, pos1, pos2);
  const distanceBonus = distance * 2;

  return baseScore + distanceBonus;
}

/**
 * Check if the board is completely cleared (all cells are null)
 */
export function isBoardCleared(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell.value === null));
}

/**
 * Check if any valid match exists on the board
 */
export function hasAnyValidMatch(board: Board): boolean {
  const rows = board.length;
  if (rows === 0) return false;
  const cols = board[0].length;

  // Check each cell to see if it has a valid match
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = board[row][col];
      if (cell.value === null) continue;

      // Check against all other cells
      for (let row2 = 0; row2 < rows; row2++) {
        for (let col2 = 0; col2 < cols; col2++) {
          if (row === row2 && col === col2) continue;

          const other = board[row2][col2];
          if (other.value === null) continue;

          // Check if values match
          if (cell.value === other.value || cell.value + other.value === 10) {
            // Check if there's a valid path
            if (hasValidPath(board, { row, col }, { row: row2, col: col2 })) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

/**
 * Check if a row is completely cleared (all cells are null)
 */
function isRowCleared(row: Cell[]): boolean {
  return row.every((cell) => cell.value === null);
}

/**
 * Get indices of all completely cleared rows
 */
export function getClearedRowIndices(board: Board): number[] {
  return board
    .map((row, index) => (isRowCleared(row) ? index : -1))
    .filter((index) => index !== -1);
}

/**
 * Remove completely cleared rows from the board and update cell positions.
 * Returns the new board with cleared rows removed.
 */
export function removeClearedRows(board: Board): Board {
  // Filter out cleared rows
  const remainingRows = board.filter((row) => !isRowCleared(row));

  // If no rows were removed, return original board
  if (remainingRows.length === board.length) {
    return board;
  }

  // Update positions for all cells in remaining rows
  return remainingRows.map((row, newRowIndex) =>
    row.map((cell, colIndex) => ({
      ...cell,
      position: { row: newRowIndex, col: colIndex },
    }))
  );
}
