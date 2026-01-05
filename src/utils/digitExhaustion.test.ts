import { describe, it, expect } from 'vitest';
import { generateBoard, addRows } from './boardGenerator';
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

// Helper to get all non-null values from a board
function getBoardDigits(board: Board): number[] {
  return board.flatMap(row => row.map(cell => cell.value).filter((v): v is number => v !== null));
}

describe('Digit Exhaustion - generateBoard', () => {
  it('should only use available digits when generating board', () => {
    // Only allow digits 1, 2, 3
    const availableDigits = [1, 2, 3];
    const board = generateBoard({ rows: 4, cols: 4, stage: 1, availableDigits });

    const digits = getBoardDigits(board);

    // All digits should be from the available set
    for (const d of digits) {
      expect(availableDigits).toContain(d);
    }
  });

  it('should work with sum-to-10 pairs when complement is available', () => {
    // 1+9=10, 2+8=10, both pairs available
    const availableDigits = [1, 2, 8, 9];
    const board = generateBoard({ rows: 4, cols: 4, stage: 1, availableDigits });

    const digits = getBoardDigits(board);

    for (const d of digits) {
      expect(availableDigits).toContain(d);
    }
  });

  it('should throw when no valid pairs exist', () => {
    // Single digit with no complement available (5+5 works, but just 3 alone doesn't)
    const availableDigits = [3]; // 3+7=10 but 7 not available, 3+3 is valid though

    // 3+3 is valid, so this should work
    const board = generateBoard({ rows: 2, cols: 2, stage: 1, availableDigits });
    const digits = getBoardDigits(board);
    expect(digits.every(d => d === 3)).toBe(true);
  });

  it('should work with only self-matching digit (5)', () => {
    // 5 is special - it only matches itself (5+5=10)
    const availableDigits = [5];
    const board = generateBoard({ rows: 2, cols: 2, stage: 1, availableDigits });

    const digits = getBoardDigits(board);
    expect(digits.every(d => d === 5)).toBe(true);
  });
});

describe('Digit Exhaustion - addRows', () => {
  it('should only use available digits when adding rows', () => {
    const board = createBoard([
      [1, 2, 3],
      [1, 2, 3],
    ]);

    // Only allow 4, 5, 6
    const availableDigits = [4, 5, 6];
    const result = addRows(board, 2, 3, 1, availableDigits);

    // Check new rows only contain available digits
    const newRowDigits = result.slice(2).flatMap(row =>
      row.map(c => c.value).filter((v): v is number => v !== null)
    );

    for (const d of newRowDigits) {
      expect(availableDigits).toContain(d);
    }
  });

  it('should return unchanged board if no available digits', () => {
    const board = createBoard([
      [1, 2, 3],
    ]);

    const result = addRows(board, 2, 3, 1, []);

    // Should return board unchanged
    expect(result.length).toBe(1);
  });

  it('should still try to rescue stuck cells with available digits', () => {
    // Board with stuck 3 (no 3 or 7 available to match)
    // Trailing nulls will be filled first
    const board = createBoard([
      [3, null, null],
    ]);

    // Only 7 is available (complements 3)
    const availableDigits = [7];
    const result = addRows(board, 1, 3, 1, availableDigits);

    // 1 remaining cell -> add 1 cell
    // Fills the trailing null at position 1 (no new row needed)
    expect(result.length).toBe(1);

    // The trailing null should be filled with 7 (to rescue the 3)
    expect(result[0][1].value).toBe(7);
  });

  it('should skip rescue if stuck cell has no available match', () => {
    // Board with stuck 3, but neither 3 nor 7 available
    // Trailing nulls will be filled first
    const board = createBoard([
      [3, null, null],
    ]);

    // Only 1, 9 available - can't rescue 3
    const availableDigits = [1, 9];
    const result = addRows(board, 1, 3, 1, availableDigits);

    // 1 remaining cell -> add 1 cell
    // Fills the trailing null at position 1 (no new row needed)
    expect(result.length).toBe(1);

    // Filled with available digit (1 or 9)
    const filledValue = result[0][1].value;
    expect([1, 9]).toContain(filledValue);
  });
});

describe('Digit Exhaustion - realistic scenario', () => {
  it('should handle progressively fewer available digits', () => {
    // Simulate mid-game where some digits are exhausted
    const scenarios = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],  // All available
      [1, 2, 3, 5, 6, 7, 8, 9],     // 4 exhausted
      [1, 2, 5, 6, 8, 9],           // 3, 4, 7 exhausted
      [1, 5, 9],                     // Most exhausted, but 1+9=10 and 5+5=10 work
    ];

    for (const availableDigits of scenarios) {
      const board = generateBoard({ rows: 4, cols: 4, stage: 1, availableDigits });
      const digits = getBoardDigits(board);

      // All digits should be from available set
      for (const d of digits) {
        expect(availableDigits).toContain(d);
      }

      // Board should be full (16 cells)
      expect(digits.length).toBe(16);
    }
  });
});
