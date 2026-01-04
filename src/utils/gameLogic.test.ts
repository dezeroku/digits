import { describe, it, expect } from 'vitest';
import {
  canMatchValues,
  hasValidPath,
  canMatch,
  removeMatch,
  calculateScore,
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
  it('should return sum of matched cell values', () => {
    const board = createBoard([
      [3, 7],
    ]);
    expect(calculateScore(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(10);
  });

  it('should return 0 for null cells', () => {
    const board = createBoard([
      [null, 5],
    ]);
    expect(calculateScore(board, { row: 0, col: 0 }, { row: 0, col: 1 })).toBe(0);
  });
});
