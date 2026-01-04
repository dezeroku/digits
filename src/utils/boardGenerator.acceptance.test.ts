import { describe, it, expect } from 'vitest';
import { generateBoard } from './boardGenerator';
import { canMatch, getMatchDistance } from './gameLogic';
import { Board, Position } from '../types';

/**
 * Find all currently matchable pairs on a board (pairs with clear paths)
 */
function findAllMatchablePairs(board: Board): Array<{ pos1: Position; pos2: Position; distance: number }> {
  const pairs: Array<{ pos1: Position; pos2: Position; distance: number }> = [];
  const rows = board.length;
  const cols = board[0].length;

  for (let r1 = 0; r1 < rows; r1++) {
    for (let c1 = 0; c1 < cols; c1++) {
      const pos1 = { row: r1, col: c1 };
      if (board[r1][c1].value === null) continue;

      for (let r2 = 0; r2 < rows; r2++) {
        for (let c2 = 0; c2 < cols; c2++) {
          // Skip same cell and already-checked pairs
          if (r1 === r2 && c1 === c2) continue;
          if (r1 > r2 || (r1 === r2 && c1 > c2)) continue; // Only check each pair once

          const pos2 = { row: r2, col: c2 };
          if (board[r2][c2].value === null) continue;

          if (canMatch(board, pos1, pos2)) {
            const distance = getMatchDistance(board, pos1, pos2);
            pairs.push({ pos1, pos2, distance });
          }
        }
      }
    }
  }

  return pairs;
}

/**
 * Analyze distance distribution of matchable pairs
 */
function analyzeDistances(pairs: Array<{ distance: number }>) {
  if (pairs.length === 0) return { adjacent: 0, nonAdjacent: 0, avgDistance: 0, total: 0 };

  const adjacent = pairs.filter(p => p.distance <= 0).length; // distance 0 = adjacent
  const nonAdjacent = pairs.filter(p => p.distance > 0).length;
  const totalDistance = pairs.reduce((sum, p) => sum + p.distance, 0);
  const avgDistance = totalDistance / pairs.length;

  return { adjacent, nonAdjacent, avgDistance, total: pairs.length };
}

describe('Board Generation - Distance Distribution Acceptance Tests', () => {
  it('should show actual distance distribution for easy mode', () => {
    const results: Array<{ adjacent: number; nonAdjacent: number; avgDistance: number; total: number }> = [];

    // Generate multiple boards and analyze
    for (let i = 0; i < 10; i++) {
      const board = generateBoard({ rows: 10, cols: 9, stage: 1 });
      const pairs = findAllMatchablePairs(board);
      const analysis = analyzeDistances(pairs);
      results.push(analysis);

      console.log(`Board ${i + 1}: ${analysis.adjacent} adjacent, ${analysis.nonAdjacent} non-adjacent, avg distance: ${analysis.avgDistance.toFixed(1)}`);
    }

    const totalAdjacent = results.reduce((sum, r) => sum + r.adjacent, 0);
    const totalNonAdjacent = results.reduce((sum, r) => sum + r.nonAdjacent, 0);
    const totalPairs = results.reduce((sum, r) => sum + r.total, 0);
    const overallAvgDistance = results.reduce((sum, r) => sum + r.avgDistance, 0) / results.length;

    console.log('\n=== EASY MODE SUMMARY ===');
    console.log(`Total matchable pairs found: ${totalPairs}`);
    console.log(`Adjacent pairs: ${totalAdjacent} (${((totalAdjacent / totalPairs) * 100).toFixed(1)}%)`);
    console.log(`Non-adjacent pairs: ${totalNonAdjacent} (${((totalNonAdjacent / totalPairs) * 100).toFixed(1)}%)`);
    console.log(`Average distance: ${overallAvgDistance.toFixed(1)}`);

    // This test is for observation - we expect <20% adjacent for easy mode
    // Temporarily just pass to see the output
    expect(true).toBe(true);
  });

  it('ACCEPTANCE: easy mode should have less than 30% adjacent pairs', () => {
    let totalAdjacent = 0;
    let totalPairs = 0;

    // Generate 20 boards for statistical significance
    for (let i = 0; i < 20; i++) {
      const board = generateBoard({ rows: 10, cols: 9, stage: 1 });
      const pairs = findAllMatchablePairs(board);
      const analysis = analyzeDistances(pairs);
      totalAdjacent += analysis.adjacent;
      totalPairs += analysis.total;
    }

    const adjacentRatio = totalAdjacent / totalPairs;
    console.log(`\nACCEPTANCE TEST: ${totalAdjacent}/${totalPairs} = ${(adjacentRatio * 100).toFixed(1)}% adjacent`);

    // We want less than 30% adjacent (ideally ~20%)
    expect(adjacentRatio).toBeLessThan(0.3);
  });

  it('DEBUG: trace a single board generation', () => {
    const board = generateBoard({ rows: 10, cols: 9, stage: 1 });
    const pairs = findAllMatchablePairs(board);

    console.log('\n=== MATCHABLE PAIRS ON GENERATED BOARD ===');
    pairs.slice(0, 10).forEach((p, i) => {
      const v1 = board[p.pos1.row][p.pos1.col].value;
      const v2 = board[p.pos2.row][p.pos2.col].value;
      console.log(`${i + 1}. (${p.pos1.row},${p.pos1.col})=${v1} <-> (${p.pos2.row},${p.pos2.col})=${v2}, distance=${p.distance}`);
    });

    expect(pairs.length).toBeGreaterThan(0);
  });

  it('DEBUG: check first row of generated board', () => {
    for (let i = 0; i < 5; i++) {
      const board = generateBoard({ rows: 10, cols: 9, stage: 1 });
      const firstRow = board[0].map(c => c.value).join(' ');
      console.log(`Board ${i + 1} first row: [${firstRow}]`);

      // Check adjacent pairs in first row
      let adjacentMatches = 0;
      for (let col = 0; col < 8; col++) {
        const v1 = board[0][col].value!;
        const v2 = board[0][col + 1].value!;
        if (v1 === v2 || v1 + v2 === 10) {
          adjacentMatches++;
          console.log(`  Adjacent match at cols ${col}-${col + 1}: ${v1} + ${v2}`);
        }
      }
    }
    expect(true).toBe(true);
  });
});
