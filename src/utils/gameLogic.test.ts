import { describe, it, expect } from 'vitest';
import {
  canMatchValues,
  hasValidPath,
  canMatch,
  removeMatch,
  calculateScore,
  isBoardCleared,
  getMatchDistance,
  removeClearedRows,
  hasAnyValidMatch,
} from './gameLogic';
import { Board, Cell } from '../types';

// Helper to create a cell
function cell(value: number | null, row: number, col: number): Cell {
  return { value, position: { row, col } };
}

// Helper to create a board from a 2D array of values
function createBoard(values: (number | null)[][]): Board {
  return values.map((row, rowIdx) =>
    row.map((value, colIdx) => cell(value, rowIdx, colIdx))
  );
}

describe('canMatchValues', () => {
  it('should match same digits', () => {
    expect(canMatchValues(5, 5)).toBe(true);
    expect(canMatchValues(1, 1)).toBe(true);
    expect(canMatchValues(9, 9)).toBe(true);
  });

  it('should match digits that sum to 10', () => {
    expect(canMatchValues(1, 9)).toBe(true);
    expect(canMatchValues(2, 8)).toBe(true);
    expect(canMatchValues(3, 7)).toBe(true);
    expect(canMatchValues(4, 6)).toBe(true);
    expect(canMatchValues(5, 5)).toBe(true); // 5+5=10
  });

  it('should not match different digits that do not sum to 10', () => {
    expect(canMatchValues(1, 2)).toBe(false);
    expect(canMatchValues(3, 5)).toBe(false);
    expect(canMatchValues(7, 8)).toBe(false);
  });
});

describe('hasValidPath', () => {
  describe('horizontal path', () => {
    it('should allow adjacent cells on same row', () => {
      const board = createBoard([
        [1, 2, 3],
        [4, 5, 6],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
    });

    it('should allow non-adjacent cells with empty cells between', () => {
      const board = createBoard([
        [1, null, null, 2],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 0, col: 3 })).toBe(true);
    });

    it('should block when cell is between', () => {
      const board = createBoard([
        [1, 5, 2],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
    });
  });

  describe('vertical path', () => {
    it('should allow adjacent cells in same column', () => {
      const board = createBoard([
        [1, 2],
        [3, 4],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 1, col: 0 })).toBe(true);
    });

    it('should allow non-adjacent cells with empty cells between', () => {
      const board = createBoard([
        [1],
        [null],
        [null],
        [2],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 3, col: 0 })).toBe(true);
    });

    it('should block when cell is between', () => {
      const board = createBoard([
        [1],
        [5],
        [2],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 2, col: 0 })).toBe(false);
    });
  });

  describe('diagonal path', () => {
    it('should allow adjacent diagonal cells', () => {
      const board = createBoard([
        [1, 2],
        [3, 4],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 1, col: 1 })).toBe(true);
    });

    it('should allow non-adjacent diagonal with empty cells between', () => {
      const board = createBoard([
        [1, 2, 3],
        [4, null, 6],
        [7, 8, 9],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 2, col: 2 })).toBe(true);
    });

    it('should block when cell is on diagonal path', () => {
      const board = createBoard([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
    });

    it('should work for other diagonal directions', () => {
      const board = createBoard([
        [1, 2, 3],
        [4, null, 6],
        [7, 8, 9],
      ]);
      // Top-right to bottom-left
      expect(hasValidPath(board, { row: 0, col: 2 }, { row: 2, col: 0 })).toBe(true);
    });
  });

  describe('horizontal wrap path', () => {
    it('should allow matching across row boundaries when path is clear', () => {
      const board = createBoard([
        [1, 2, null],
        [null, 3, 4],
      ]);
      // From end of row 0 to start of row 1
      expect(hasValidPath(board, { row: 0, col: 2 }, { row: 1, col: 0 })).toBe(true);
    });

    it('should allow matching with empty cells in wrap path', () => {
      const board = createBoard([
        [1, null, null],
        [null, null, 2],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 1, col: 2 })).toBe(true);
    });

    it('should block wrap path when cell is in the way', () => {
      // 4-column board: (0,0) to (1,2) is not on same row/col/diagonal
      // row diff = 1, col diff = 2, so |1| != |2| means not diagonal
      // Wrap path goes through indices 1,2,3,4,5 - the 5 at index 2 (pos 0,2) blocks it
      const board = createBoard([
        [1, null, 5, null],
        [null, null, 9, null],
      ]);
      expect(hasValidPath(board, { row: 0, col: 0 }, { row: 1, col: 2 })).toBe(false);
    });
  });

  it('should not allow same position', () => {
    const board = createBoard([[1]]);
    expect(hasValidPath(board, { row: 0, col: 0 }, { row: 0, col: 0 })).toBe(false);
  });
});

describe('canMatch', () => {
  it('should match when values and path are valid', () => {
    const board = createBoard([
      [5, null, 5],
    ]);
    expect(canMatch(board, { row: 0, col: 0 }, { row: 0, col: 2 })).toBe(true);
  });

  it('should match digits summing to 10 with valid path', () => {
    const board = createBoard([
      [3, null, 7],
    ]);
    expect(canMatch(board, { row: 0, col: 0 }, { row: 0, col: 2 })).toBe(true);
  });

  it('should not match when values do not match', () => {
    const board = createBoard([
      [3, null, 5],
    ]);
    expect(canMatch(board, { row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
  });

  it('should not match when path is blocked', () => {
    const board = createBoard([
      [5, 3, 5],
    ]);
    expect(canMatch(board, { row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false);
  });

  it('should not match null cells', () => {
    const board = createBoard([
      [null, 5],
    ]);
    expect(canMatch(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(false);
  });
});

describe('removeMatch', () => {
  it('should set matched cells to null', () => {
    const board = createBoard([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const result = removeMatch(board, { row: 0, col: 0 }, { row: 1, col: 2 });

    expect(result[0][0].value).toBe(null);
    expect(result[1][2].value).toBe(null);
    // Other cells unchanged
    expect(result[0][1].value).toBe(2);
    expect(result[1][1].value).toBe(5);
  });

  it('should not mutate original board', () => {
    const board = createBoard([
      [1, 2],
    ]);
    removeMatch(board, { row: 0, col: 0 }, { row: 0, col: 1 });

    expect(board[0][0].value).toBe(1);
    expect(board[0][1].value).toBe(2);
  });
});

describe('calculateScore', () => {
  it('should return base score for adjacent cells (no distance bonus)', () => {
    const board = createBoard([
      [3, 7],
    ]);
    // Adjacent cells: distance = 0, bonus = 0
    // Base score = 3 + 7 = 10
    expect(calculateScore(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(10);
  });

  it('should add distance bonus for cells with gap between', () => {
    const board = createBoard([
      [3, null, null, 7],
    ]);
    // Distance = 2 cells between, bonus = 2 * 2 = 4
    // Base score = 3 + 7 = 10
    // Total = 10 + 4 = 14
    expect(calculateScore(board, { row: 0, col: 0 }, { row: 0, col: 3 })).toBe(14);
  });

  it('should calculate larger distance bonus for further cells', () => {
    const board = createBoard([
      [5, null, null, null, null, 5],
    ]);
    // Distance = 4 cells between, bonus = 4 * 2 = 8
    // Base score = 5 + 5 = 10
    // Total = 10 + 8 = 18
    expect(calculateScore(board, { row: 0, col: 0 }, { row: 0, col: 5 })).toBe(18);
  });

  it('should return 0 for null cells', () => {
    const board = createBoard([
      [null, 5],
    ]);
    expect(calculateScore(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(0);
  });
});

describe('isBoardCleared', () => {
  it('should return true for completely empty board', () => {
    const board = createBoard([
      [null, null],
      [null, null],
    ]);
    expect(isBoardCleared(board)).toBe(true);
  });

  it('should return false if any cell has a value', () => {
    const board = createBoard([
      [null, null],
      [null, 5],
    ]);
    expect(isBoardCleared(board)).toBe(false);
  });

  it('should return false for full board', () => {
    const board = createBoard([
      [1, 2],
      [3, 4],
    ]);
    expect(isBoardCleared(board)).toBe(false);
  });
});

describe('getMatchDistance', () => {
  it('should return 0 for adjacent cells', () => {
    const board = createBoard([
      [1, 2, 3],
    ]);
    expect(getMatchDistance(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(0);
  });

  it('should return number of cells between positions', () => {
    const board = createBoard([
      [1, null, null, 2],
    ]);
    // 2 cells between positions 0 and 3
    expect(getMatchDistance(board, { row: 0, col: 0 }, { row: 0, col: 3 })).toBe(2);
  });

  it('should work across rows (wrap-around distance)', () => {
    const board = createBoard([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    // Position (0,2) is index 2, position (1,0) is index 3
    // Distance = |3 - 2| - 1 = 0 (adjacent in linear order)
    expect(getMatchDistance(board, { row: 0, col: 2 }, { row: 1, col: 0 })).toBe(0);
  });

  it('should calculate correct distance for positions on different rows', () => {
    const board = createBoard([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]);
    // Position (0,0) is index 0, position (1,2) is index 6
    // Distance = |6 - 0| - 1 = 5
    expect(getMatchDistance(board, { row: 0, col: 0 }, { row: 1, col: 2 })).toBe(5);
  });

  it('should be symmetric (same distance regardless of order)', () => {
    const board = createBoard([
      [1, 2, 3, 4, 5],
    ]);
    const dist1 = getMatchDistance(board, { row: 0, col: 0 }, { row: 0, col: 4 });
    const dist2 = getMatchDistance(board, { row: 0, col: 4 }, { row: 0, col: 0 });
    expect(dist1).toBe(dist2);
    expect(dist1).toBe(3);
  });
});

describe('removeClearedRows', () => {
  it('should remove a completely cleared row', () => {
    const board = createBoard([
      [1, 2, 3],
      [null, null, null],
      [4, 5, 6],
    ]);
    const result = removeClearedRows(board);
    expect(result.length).toBe(2);
    expect(result[0][0].value).toBe(1);
    expect(result[1][0].value).toBe(4);
  });

  it('should update cell positions after row removal', () => {
    const board = createBoard([
      [1, 2, 3],
      [null, null, null],
      [4, 5, 6],
    ]);
    const result = removeClearedRows(board);

    // Row that was at index 2 should now be at index 1
    expect(result[1][0].position).toEqual({ row: 1, col: 0 });
    expect(result[1][1].position).toEqual({ row: 1, col: 1 });
    expect(result[1][2].position).toEqual({ row: 1, col: 2 });
  });

  it('should remove multiple cleared rows', () => {
    const board = createBoard([
      [null, null, null],
      [1, 2, 3],
      [null, null, null],
      [4, 5, 6],
      [null, null, null],
    ]);
    const result = removeClearedRows(board);
    expect(result.length).toBe(2);
    expect(result[0][0].value).toBe(1);
    expect(result[1][0].value).toBe(4);
  });

  it('should return original board if no rows are cleared', () => {
    const board = createBoard([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    const result = removeClearedRows(board);
    expect(result).toBe(board); // Same reference
  });

  it('should handle board with partial cleared cells (not full row)', () => {
    const board = createBoard([
      [1, null, 3],
      [null, 5, null],
    ]);
    const result = removeClearedRows(board);
    expect(result.length).toBe(2); // No rows removed
    expect(result).toBe(board);
  });

  it('should handle empty board (all rows cleared)', () => {
    const board = createBoard([
      [null, null, null],
      [null, null, null],
    ]);
    const result = removeClearedRows(board);
    expect(result.length).toBe(0);
  });

  it('should correctly update positions for all remaining cells', () => {
    const board = createBoard([
      [1, 2],
      [null, null],
      [3, 4],
      [null, null],
      [5, 6],
    ]);
    const result = removeClearedRows(board);

    expect(result.length).toBe(3);

    // Check all positions are correctly updated
    expect(result[0][0].position).toEqual({ row: 0, col: 0 });
    expect(result[0][1].position).toEqual({ row: 0, col: 1 });
    expect(result[1][0].position).toEqual({ row: 1, col: 0 });
    expect(result[1][1].position).toEqual({ row: 1, col: 1 });
    expect(result[2][0].position).toEqual({ row: 2, col: 0 });
    expect(result[2][1].position).toEqual({ row: 2, col: 1 });
  });
});

describe('hasAnyValidMatch', () => {
  it('should return true when matching pair exists (same values)', () => {
    const board = createBoard([
      [3, null, 3],
    ]);
    expect(hasAnyValidMatch(board)).toBe(true);
  });

  it('should return true when matching pair exists (sum to 10)', () => {
    const board = createBoard([
      [3, null, 7],
    ]);
    expect(hasAnyValidMatch(board)).toBe(true);
  });

  it('should return false when no matching pairs exist', () => {
    const board = createBoard([
      [3, null, 4],
    ]);
    expect(hasAnyValidMatch(board)).toBe(false);
  });

  it('should return false when path is blocked', () => {
    const board = createBoard([
      [3, 5, 3],
    ]);
    expect(hasAnyValidMatch(board)).toBe(false);
  });

  it('should return false for empty board', () => {
    const board = createBoard([
      [null, null],
      [null, null],
    ]);
    expect(hasAnyValidMatch(board)).toBe(false);
  });

  it('should return true for diagonal match', () => {
    const board = createBoard([
      [3, null],
      [null, 3],
    ]);
    expect(hasAnyValidMatch(board)).toBe(true);
  });

  it('should return true for wrap-around match', () => {
    const board = createBoard([
      [null, null, 3],
      [7, null, null],
    ]);
    expect(hasAnyValidMatch(board)).toBe(true);
  });

  it('should return false when single cell remains', () => {
    const board = createBoard([
      [null, 5, null],
      [null, null, null],
    ]);
    expect(hasAnyValidMatch(board)).toBe(false);
  });

  it('should detect game over scenario (multiple stuck cells)', () => {
    // All cells are stuck - no valid matches
    const board = createBoard([
      [1, 2, 3],
      [4, 5, 6],
    ]);
    // 1 can only match 1 or 9 - none adjacent or with clear path
    // Actually let me check... 1+9=10, 2+8=10, etc.
    // In this board, no same values and no sums to 10 with clear paths
    expect(hasAnyValidMatch(board)).toBe(false);
  });
});
