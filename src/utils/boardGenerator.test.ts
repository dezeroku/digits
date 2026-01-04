import { describe, it, expect } from 'vitest';
import { generateBoard, addRows, createRow } from './boardGenerator';

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
    const board = generateBoard(20, 12);
    expect(board).toHaveLength(20);
    board.forEach((row) => {
      expect(row).toHaveLength(12);
    });
  });

  it('should use default dimensions when not specified', () => {
    const board = generateBoard();
    expect(board).toHaveLength(20);
    expect(board[0]).toHaveLength(12);
  });

  it('should set correct positions for all cells', () => {
    const board = generateBoard(5, 5);
    board.forEach((row, rowIdx) => {
      row.forEach((cell, colIdx) => {
        expect(cell.position.row).toBe(rowIdx);
        expect(cell.position.col).toBe(colIdx);
      });
    });
  });

  it('should generate values between 1 and 9 for all cells', () => {
    const board = generateBoard(10, 10);
    board.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.value).toBeGreaterThanOrEqual(1);
        expect(cell.value).toBeLessThanOrEqual(9);
      });
    });
  });
});

describe('addRows', () => {
  it('should add specified number of rows to the board', () => {
    const board = generateBoard(5, 5);
    const newBoard = addRows(board, 4, 5);

    expect(newBoard).toHaveLength(9);
  });

  it('should preserve existing rows', () => {
    const board = generateBoard(3, 3);
    const originalValues = board.map((row) =>
      row.map((cell) => cell.value)
    );

    const newBoard = addRows(board, 2, 3);

    // Check first 3 rows are unchanged
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(newBoard[r][c].value).toBe(originalValues[r][c]);
      }
    }
  });

  it('should set correct row indices for new rows', () => {
    const board = generateBoard(5, 5);
    const newBoard = addRows(board, 3, 5);

    // New rows should have indices 5, 6, 7
    expect(newBoard[5][0].position.row).toBe(5);
    expect(newBoard[6][0].position.row).toBe(6);
    expect(newBoard[7][0].position.row).toBe(7);
  });

  it('should not mutate original board', () => {
    const board = generateBoard(3, 3);
    const originalLength = board.length;

    addRows(board, 4, 3);

    expect(board).toHaveLength(originalLength);
  });

  it('should use default values when not specified', () => {
    const board = generateBoard(5, 12);
    const newBoard = addRows(board);

    expect(newBoard).toHaveLength(9); // 5 + 4 default
    expect(newBoard[8]).toHaveLength(12); // default cols
  });
});
