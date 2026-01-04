import { describe, it, expect } from 'vitest';
import { addRows } from './boardGenerator';
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

// Helper to get all values from a board
function getBoardValues(board: Board): (number | null)[] {
  return board.flatMap(row => row.map(cell => cell.value));
}

// Helper to count occurrences of each value
function countValues(values: (number | null)[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const v of values) {
    if (v !== null) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
  }
  return counts;
}

// Check if a value can match another (same or sum to 10)
function canMatch(a: number, b: number): boolean {
  return a === b || a + b === 10;
}

describe('addRows - rescue mechanism', () => {
  it('should add the correct number of rows', () => {
    const board = createBoard([
      [1, 2, 3],
      [4, 5, 6],
    ]);

    const result = addRows(board, 2, 3);

    expect(result.length).toBe(4); // 2 original + 2 new
    expect(result[2].length).toBe(3);
    expect(result[3].length).toBe(3);
  });

  it('should update positions correctly for new rows', () => {
    const board = createBoard([
      [1, 2, 3],
    ]);

    const result = addRows(board, 2, 3);

    // Check new row positions
    expect(result[1][0].position).toEqual({ row: 1, col: 0 });
    expect(result[1][2].position).toEqual({ row: 1, col: 2 });
    expect(result[2][1].position).toEqual({ row: 2, col: 1 });
  });

  it('should generate rescue values for stuck cells', () => {
    // Board with a single stuck cell (3 has no match - no other 3 or 7)
    const board = createBoard([
      [3, null, null],
      [null, null, null],
    ]);

    const result = addRows(board, 2, 3);
    const newValues = getBoardValues(result.slice(2));

    // New rows should contain at least one value that can match 3 (either 3 or 7)
    const hasRescueValue = newValues.some(v => v !== null && canMatch(v, 3));
    expect(hasRescueValue).toBe(true);
  });

  it('should generate rescue values for multiple stuck cells', () => {
    // Board with multiple stuck cells that can't match each other
    // 3 needs 3 or 7, 4 needs 4 or 6, 2 needs 2 or 8
    const board = createBoard([
      [3, null, 4],
      [null, 2, null],
    ]);

    const result = addRows(board, 2, 3);
    const newValues = getBoardValues(result.slice(2)).filter(v => v !== null) as number[];

    // Should have rescue values for each stuck cell
    const has3Match = newValues.some(v => canMatch(v, 3));
    const has4Match = newValues.some(v => canMatch(v, 4));
    const has2Match = newValues.some(v => canMatch(v, 2));

    expect(has3Match).toBe(true);
    expect(has4Match).toBe(true);
    expect(has2Match).toBe(true);
  });

  it('should not treat cells with valid matches as stuck', () => {
    // Board where 3 and 7 can match each other (not stuck)
    const board = createBoard([
      [3, 7],
    ]);

    const result = addRows(board, 1, 2);
    const newValues = getBoardValues(result.slice(1)).filter(v => v !== null) as number[];

    // New values should be random pairs, not necessarily 3s and 7s
    // (though they could be by chance)
    expect(newValues.length).toBe(2);

    // The two new values should be able to match each other
    expect(canMatch(newValues[0], newValues[1])).toBe(true);
  });

  it('should handle more stuck cells than new cells available', () => {
    // 6 stuck cells but only adding 4 new cells (2 rows x 2 cols)
    const board = createBoard([
      [1, 2],  // 1 and 2 are stuck (no 1, 9, 2, or 8 to match)
      [3, 4],  // 3 and 4 are stuck
      [5, 6],  // 5 and 6 are stuck
    ]);

    const result = addRows(board, 2); // 2 rows x 2 cols = 4 new cells
    const newValues = getBoardValues(result.slice(3)).filter(v => v !== null) as number[];

    expect(newValues.length).toBe(4);

    // All new values should form valid pairs among themselves
    // Count how many can match with at least one other new value
    let matchableCount = 0;
    for (let i = 0; i < newValues.length; i++) {
      for (let j = 0; j < newValues.length; j++) {
        if (i !== j && canMatch(newValues[i], newValues[j])) {
          matchableCount++;
          break;
        }
      }
    }

    // At least some values should be matchable (rescue pairs are added in pairs)
    expect(matchableCount).toBeGreaterThan(0);
  });

  it('should prioritize rescue values when stuck cells exceed capacity', () => {
    // Create a board with many stuck cells (4 stuck cells)
    // Adding only 1 row of 2 cells, so we can only rescue some of them
    const board = createBoard([
      [1, 2],
      [3, 4],
    ]);

    // Run multiple times to check behavior is consistent
    for (let i = 0; i < 10; i++) {
      const result = addRows(board, 1); // Only 2 new cells (1 row x 2 cols)
      const newValues = getBoardValues(result.slice(2)).filter(v => v !== null) as number[];

      expect(newValues.length).toBe(2);

      // The two new values should be matchable with each other
      expect(canMatch(newValues[0], newValues[1])).toBe(true);

      // At least one should be a rescue value (matches a stuck cell)
      const rescuesStuckCell = newValues.some(v =>
        canMatch(v, 1) || canMatch(v, 2) || canMatch(v, 3) || canMatch(v, 4)
      );
      expect(rescuesStuckCell).toBe(true);
    }
  });

  it('should fill remaining cells with random matchable pairs when few stuck cells', () => {
    // Only 1 stuck cell, but adding many new cells
    const board = createBoard([
      [5, null, null],
    ]);

    const result = addRows(board, 2, 3); // 6 new cells
    const newValues = getBoardValues(result.slice(1)).filter(v => v !== null) as number[];

    expect(newValues.length).toBe(6);

    // Should have a rescue value for 5 (either 5 or 5)
    const has5Match = newValues.some(v => canMatch(v, 5));
    expect(has5Match).toBe(true);

    // All values should be 1-9
    for (const v of newValues) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(9);
    }
  });

  it('should handle empty board (no stuck cells)', () => {
    const board = createBoard([
      [null, null],
      [null, null],
    ]);

    const result = addRows(board, 1, 2);
    const newValues = getBoardValues(result.slice(2)).filter(v => v !== null) as number[];

    expect(newValues.length).toBe(2);
    // Should still generate matchable pairs
    expect(canMatch(newValues[0], newValues[1])).toBe(true);
  });

  it('should mix barrier and rescue cells with some randomness', () => {
    // Board with 2 stuck cells
    const board = createBoard([
      [3, null],  // 3 is stuck
      [null, 4],  // 4 is stuck
    ]);

    // Track rescue cell positions across multiple runs
    const rescuePositions: number[] = [];
    const rescueValues = [3, 7, 4, 6]; // Values that match 3 or 4

    for (let i = 0; i < 20; i++) {
      const result = addRows(board, 3); // 3 rows x 2 cols = 6 new cells
      const newValues = getBoardValues(result.slice(2)).filter(v => v !== null) as number[];

      expect(newValues.length).toBe(6);

      // Track where rescue values appear
      newValues.forEach((v, idx) => {
        if (rescueValues.includes(v)) {
          rescuePositions.push(idx);
        }
      });
    }

    // Rescue cells should appear in various positions (not always at the end)
    // due to randomness. Check that they appear in at least 3 different positions.
    const uniquePositions = new Set(rescuePositions);
    expect(uniquePositions.size).toBeGreaterThanOrEqual(3);
  });

  it('should ensure new rows are self-solvable', () => {
    // Run multiple times to verify pairs are always matchable
    for (let i = 0; i < 20; i++) {
      const board = createBoard([
        [3, null, 7], // 3 and 7 can match each other, not stuck
      ]);

      const result = addRows(board, 2, 4); // 8 new cells
      const newValues = getBoardValues(result.slice(1)).filter(v => v !== null) as number[];

      // Count values
      const counts = countValues(newValues);

      // Each value should have at least one match partner
      // (same value appears multiple times, or its 10-complement exists)
      for (const [value, count] of counts) {
        const complement = 10 - value;
        const complementCount = counts.get(complement) || 0;
        const totalMatchable = (value === complement) ? count : count + complementCount;

        // Should have at least 2 matchable values (can form at least one pair)
        expect(totalMatchable).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
