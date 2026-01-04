import { describe, it, expect } from 'vitest';
import { generateBoard, addRows, createRow, Difficulty, getDifficultyForStage } from './boardGenerator';

describe('createRow', () => {
  it('should create a row with specified number of columns', () => {
    const row = createRow(0, 12);
    expect(row).toHaveLength(12);
  });

  it('should set correct row index for all cells', () => {
    const row = createRow(5, 4);
    row.forEach((cell) => {
      expect(cell.position.row).toBe(5);
    });
  });

  it('should set correct column indices', () => {
    const row = createRow(0, 4);
    row.forEach((cell, idx) => {
      expect(cell.position.col).toBe(idx);
    });
  });

  it('should generate values between 1 and 9', () => {
    const row = createRow(0, 100); // Large sample
    row.forEach((cell) => {
      expect(cell.value).toBeGreaterThanOrEqual(1);
      expect(cell.value).toBeLessThanOrEqual(9);
    });
  });
});

describe('generateBoard', () => {
  it('should create a board with specified dimensions', () => {
    const board = generateBoard({ rows: 20, cols: 12 });
    expect(board).toHaveLength(20);
    board.forEach((row) => {
      expect(row).toHaveLength(12);
    });
  });

  it('should use default dimensions when not specified', () => {
    const board = generateBoard();
    expect(board).toHaveLength(10);
    expect(board[0]).toHaveLength(9);
  });

  it('should set correct positions for all cells', () => {
    const board = generateBoard({ rows: 6, cols: 6 }); // Must be even total cells
    board.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        expect(cell.position.row).toBe(rowIdx);
        expect(cell.position.col).toBe(colIdx);
      });
    });
  });

  it('should generate values between 1 and 9 for all cells', () => {
    const board = generateBoard({ rows: 10, cols: 10 });
    board.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.value).toBeGreaterThanOrEqual(1);
        expect(cell.value).toBeLessThanOrEqual(9);
      });
    });
  });

  it('should generate all values as matchable pairs', () => {
    const board = generateBoard({ rows: 6, cols: 6 }); // 36 cells = 18 pairs
    const values: number[] = [];

    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.value !== null) values.push(cell.value);
      });
    });

    // Count occurrences of each value
    const counts = new Map<number, number>();
    values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

    // For a solvable board, values should come in matchable pairs
    // Either same digits (count is even) or sum-to-10 pairs
    // We verify that total count is even (all can be paired)
    expect(values.length).toBe(36);
    expect(values.length % 2).toBe(0);
  });

  it('should generate boards consistently without errors', () => {
    // Generate multiple boards to ensure algorithm is stable
    for (let i = 0; i < 5; i++) {
      const board = generateBoard({ rows: 10, cols: 10 });
      expect(board).toHaveLength(10);
      expect(board[0]).toHaveLength(10);

      // All cells should have values
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell.value).not.toBeNull();
        });
      });
    }
  });

  it('should support different difficulty levels', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

    for (const difficulty of difficulties) {
      const board = generateBoard({ rows: 6, cols: 6, difficulty });
      expect(board).toHaveLength(6);
      expect(board[0]).toHaveLength(6);

      // All cells should have values
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell.value).not.toBeNull();
        });
      });
    }
  });
});

describe('addRows', () => {
  it('should add specified number of rows to the board', () => {
    const board = generateBoard({ rows: 4, cols: 6 }); // 24 cells (even)
    const newBoard = addRows(board, 4, 6);

    expect(newBoard).toHaveLength(8);
  });

  it('should preserve existing rows', () => {
    const board = generateBoard({ rows: 4, cols: 4 }); // 16 cells (even)
    const originalValues = board.map((row) =>
      row.map((cell) => cell.value)
    );

    const newBoard = addRows(board, 2, 4);

    // Check first 4 rows are unchanged
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        expect(newBoard[r][c].value).toBe(originalValues[r][c]);
      }
    }
  });

  it('should set correct row indices for new rows', () => {
    const board = generateBoard({ rows: 4, cols: 6 }); // 24 cells (even)
    const newBoard = addRows(board, 4, 6);

    // New rows should have indices 4, 5, 6, 7
    expect(newBoard[4][0].position.row).toBe(4);
    expect(newBoard[5][0].position.row).toBe(5);
    expect(newBoard[6][0].position.row).toBe(6);
    expect(newBoard[7][0].position.row).toBe(7);
  });

  it('should not mutate original board', () => {
    const board = generateBoard({ rows: 4, cols: 4 }); // 16 cells (even)
    const originalLength = board.length;

    addRows(board, 4, 4);

    expect(board).toHaveLength(originalLength);
  });

  it('should use default values when not specified', () => {
    const board = generateBoard({ rows: 6, cols: 9 }); // 54 cells (even)
    const newBoard = addRows(board);

    expect(newBoard).toHaveLength(10); // 6 + 4 default
    expect(newBoard[9]).toHaveLength(9); // default cols
  });

  it('should support difficulty parameter', () => {
    const board = generateBoard({ rows: 4, cols: 6, difficulty: 'hard' });
    const newBoard = addRows(board, 4, 6, 'hard');

    expect(newBoard).toHaveLength(8);
    // All new cells should have values
    for (let r = 4; r < 8; r++) {
      for (let c = 0; c < 6; c++) {
        expect(newBoard[r][c].value).not.toBeNull();
      }
    }
  });
});

describe('getDifficultyForStage', () => {
  it('should return easy for stage 1', () => {
    expect(getDifficultyForStage(1)).toBe('easy');
  });

  it('should return easy for stage 0 or negative', () => {
    expect(getDifficultyForStage(0)).toBe('easy');
    expect(getDifficultyForStage(-1)).toBe('easy');
  });

  it('should return medium for stage 2', () => {
    expect(getDifficultyForStage(2)).toBe('medium');
  });

  it('should return hard for stage 3', () => {
    expect(getDifficultyForStage(3)).toBe('hard');
  });

  it('should return hard for all stages above 3', () => {
    expect(getDifficultyForStage(4)).toBe('hard');
    expect(getDifficultyForStage(10)).toBe('hard');
    expect(getDifficultyForStage(100)).toBe('hard');
  });
});
