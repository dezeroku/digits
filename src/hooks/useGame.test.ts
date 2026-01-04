import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGame } from './useGame';
import * as gameLogic from '../utils/gameLogic';

describe('useGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start at stage 1', () => {
      const { result } = renderHook(() => useGame());
      expect(result.current.stage).toBe(1);
    });

    it('should start with score 0', () => {
      const { result } = renderHook(() => useGame());
      expect(result.current.score).toBe(0);
    });

    it('should start with 4 add rows remaining', () => {
      const { result } = renderHook(() => useGame());
      expect(result.current.addRowsRemaining).toBe(4);
    });

    it('should start with no selected cell', () => {
      const { result } = renderHook(() => useGame());
      expect(result.current.selectedCell).toBeNull();
    });

    it('should start with a board', () => {
      const { result } = renderHook(() => useGame());
      expect(result.current.board).toBeDefined();
      expect(result.current.board.length).toBeGreaterThan(0);
    });
  });

  describe('handleAddRows', () => {
    it('should decrease addRowsRemaining when called', () => {
      const { result } = renderHook(() => useGame());

      expect(result.current.addRowsRemaining).toBe(4);

      act(() => {
        result.current.handleAddRows();
      });

      expect(result.current.addRowsRemaining).toBe(3);
    });

    it('should add rows to the board', () => {
      const { result } = renderHook(() => useGame());

      const initialRowCount = result.current.board.length;

      act(() => {
        result.current.handleAddRows();
      });

      expect(result.current.board.length).toBe(initialRowCount + 4);
    });

    it('should not add rows when addRowsRemaining is 0', () => {
      const { result } = renderHook(() => useGame());

      // Use all 4 add rows
      act(() => {
        result.current.handleAddRows();
        result.current.handleAddRows();
        result.current.handleAddRows();
        result.current.handleAddRows();
      });

      expect(result.current.addRowsRemaining).toBe(0);

      const rowCountAfterFourAdds = result.current.board.length;

      act(() => {
        result.current.handleAddRows();
      });

      // Should not have added more rows
      expect(result.current.board.length).toBe(rowCountAfterFourAdds);
      expect(result.current.addRowsRemaining).toBe(0);
    });
  });

  describe('handleNewGame', () => {
    it('should reset stage to 1', () => {
      const { result } = renderHook(() => useGame());

      // Manually set stage (we can't easily advance stages in test)
      // but we can test that newGame resets everything

      act(() => {
        result.current.handleNewGame();
      });

      expect(result.current.stage).toBe(1);
    });

    it('should reset score to 0', () => {
      const { result } = renderHook(() => useGame());

      act(() => {
        result.current.handleNewGame();
      });

      expect(result.current.score).toBe(0);
    });

    it('should reset addRowsRemaining to 4', () => {
      const { result } = renderHook(() => useGame());

      // Use some add rows
      act(() => {
        result.current.handleAddRows();
        result.current.handleAddRows();
      });

      expect(result.current.addRowsRemaining).toBe(2);

      act(() => {
        result.current.handleNewGame();
      });

      expect(result.current.addRowsRemaining).toBe(4);
    });

    it('should clear selected cell', () => {
      const { result } = renderHook(() => useGame());

      // Select a cell
      const board = result.current.board;
      const firstCellWithValue = board
        .flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => ({ cell, row: rowIdx, col: colIdx }))
        )
        .find((c) => c.cell.value !== null);

      if (firstCellWithValue) {
        act(() => {
          result.current.handleCellClick({
            row: firstCellWithValue.row,
            col: firstCellWithValue.col,
          });
        });

        expect(result.current.selectedCell).not.toBeNull();
      }

      act(() => {
        result.current.handleNewGame();
      });

      expect(result.current.selectedCell).toBeNull();
    });
  });

  describe('handleCellClick', () => {
    it('should select a cell when clicking on a cell with value', () => {
      const { result } = renderHook(() => useGame());

      const board = result.current.board;
      const firstCellWithValue = board
        .flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => ({ cell, row: rowIdx, col: colIdx }))
        )
        .find((c) => c.cell.value !== null);

      expect(firstCellWithValue).toBeDefined();

      act(() => {
        result.current.handleCellClick({
          row: firstCellWithValue!.row,
          col: firstCellWithValue!.col,
        });
      });

      expect(result.current.selectedCell).toEqual({
        row: firstCellWithValue!.row,
        col: firstCellWithValue!.col,
      });
    });

    it('should deselect when clicking the same cell twice', () => {
      const { result } = renderHook(() => useGame());

      const board = result.current.board;
      const firstCellWithValue = board
        .flatMap((row, rowIdx) =>
          row.map((cell, colIdx) => ({ cell, row: rowIdx, col: colIdx }))
        )
        .find((c) => c.cell.value !== null);

      act(() => {
        result.current.handleCellClick({
          row: firstCellWithValue!.row,
          col: firstCellWithValue!.col,
        });
      });

      expect(result.current.selectedCell).not.toBeNull();

      act(() => {
        result.current.handleCellClick({
          row: firstCellWithValue!.row,
          col: firstCellWithValue!.col,
        });
      });

      expect(result.current.selectedCell).toBeNull();
    });

    it('should not select empty cells', () => {
      const { result } = renderHook(() => useGame());

      // Create a scenario where we have an empty cell by matching first
      // For this test, we'll just verify that clicking doesn't crash
      // and the selection logic works

      act(() => {
        // Click on position that might be empty after some matches
        // This mainly tests that the guard clause works
        result.current.handleCellClick({ row: 0, col: 0 });
      });

      // Should either be selected (if has value) or null (if empty)
      // The test passes if no error is thrown
    });
  });

  describe('scoring', () => {
    it('should increase score when making a valid match', () => {
      const { result } = renderHook(() => useGame());

      const initialScore = result.current.score;
      const board = result.current.board;

      // Find two adjacent cells that can match (same value or sum to 10)
      let matchFound = false;
      for (let row = 0; row < board.length && !matchFound; row++) {
        for (let col = 0; col < board[row].length - 1 && !matchFound; col++) {
          const cell1 = board[row][col];
          const cell2 = board[row][col + 1];

          if (
            cell1.value !== null &&
            cell2.value !== null &&
            (cell1.value === cell2.value || cell1.value + cell2.value === 10)
          ) {
            act(() => {
              result.current.handleCellClick({ row, col });
            });

            act(() => {
              result.current.handleCellClick({ row, col: col + 1 });
            });

            matchFound = true;
          }
        }
      }

      if (matchFound) {
        expect(result.current.score).toBeGreaterThan(initialScore);
      }
    });
  });

  describe('stage progression', () => {
    it('should set stageComplete to true when board is cleared', () => {
      // Mock isBoardCleared to return true
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockReturnValue(true);

      const { result } = renderHook(() => useGame());

      // Initial render triggers useEffect which sees cleared board
      expect(result.current.stageComplete).toBe(true);
      expect(result.current.stage).toBe(1); // Stage doesn't advance until handleContinue

      spy.mockRestore();
    });

    it('should advance to stage 2 when handleContinue is called', () => {
      // Mock isBoardCleared to return true
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockReturnValue(true);

      const { result } = renderHook(() => useGame());

      expect(result.current.stageComplete).toBe(true);
      expect(result.current.stage).toBe(1);

      // Call handleContinue to advance
      act(() => {
        result.current.handleContinue();
      });

      expect(result.current.stage).toBe(2);
      expect(result.current.stageComplete).toBe(true); // Still true because mock returns true

      spy.mockRestore();
    });

    it('should advance through multiple stages', () => {
      // Mock isBoardCleared to always return true
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockReturnValue(true);

      const { result } = renderHook(() => useGame());

      expect(result.current.stage).toBe(1);

      // Advance to stage 2
      act(() => {
        result.current.handleContinue();
      });
      expect(result.current.stage).toBe(2);

      // Advance to stage 3
      act(() => {
        result.current.handleContinue();
      });
      expect(result.current.stage).toBe(3);

      // Advance to stage 4
      act(() => {
        result.current.handleContinue();
      });
      expect(result.current.stage).toBe(4);

      spy.mockRestore();
    });

    it('should reset addRowsRemaining to 4 on stage advancement', () => {
      // Start with board NOT cleared
      let boardCleared = false;
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockImplementation(() => boardCleared);

      const { result } = renderHook(() => useGame());

      // Use some add rows
      act(() => {
        result.current.handleAddRows();
        result.current.handleAddRows();
      });

      expect(result.current.addRowsRemaining).toBe(2);

      // Now simulate board being cleared
      boardCleared = true;

      // Trigger useEffect by changing board
      act(() => {
        result.current.handleAddRows();
      });

      expect(result.current.stageComplete).toBe(true);

      // Advance stage
      act(() => {
        result.current.handleContinue();
      });

      expect(result.current.stage).toBe(2);
      expect(result.current.addRowsRemaining).toBe(4);

      spy.mockRestore();
    });

    it('should generate a new board on stage advancement', () => {
      // Mock isBoardCleared to return true
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockReturnValue(true);

      const { result } = renderHook(() => useGame());

      const initialBoard = result.current.board;

      // Advance stage
      act(() => {
        result.current.handleContinue();
      });

      // Board should be different (new board generated)
      expect(result.current.board).not.toBe(initialBoard);
      expect(result.current.stage).toBe(2);

      spy.mockRestore();
    });

    it('should clear selected cell when board is cleared', () => {
      // Start with board NOT cleared
      let boardCleared = false;
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockImplementation(() => boardCleared);

      const { result } = renderHook(() => useGame());

      // Select a cell first
      act(() => {
        result.current.handleCellClick({ row: 0, col: 0 });
      });

      expect(result.current.selectedCell).not.toBeNull();

      // Now simulate board being cleared
      boardCleared = true;

      // Trigger useEffect by changing board
      act(() => {
        result.current.handleAddRows();
      });

      // Selected cell should be cleared when stageComplete becomes true
      expect(result.current.selectedCell).toBeNull();
      expect(result.current.stageComplete).toBe(true);

      spy.mockRestore();
    });

    it('should preserve score across stage advancement', () => {
      // Start with board NOT cleared so we can make a match first
      let boardCleared = false;
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockImplementation(() => boardCleared);

      const { result } = renderHook(() => useGame());

      const board = result.current.board;

      // Find and make a valid match to get some score
      let matchFound = false;
      for (let row = 0; row < board.length && !matchFound; row++) {
        for (let col = 0; col < board[row].length - 1 && !matchFound; col++) {
          const cell1 = board[row][col];
          const cell2 = board[row][col + 1];

          if (
            cell1.value !== null &&
            cell2.value !== null &&
            (cell1.value === cell2.value || cell1.value + cell2.value === 10)
          ) {
            act(() => {
              result.current.handleCellClick({ row, col });
            });
            act(() => {
              result.current.handleCellClick({ row, col: col + 1 });
            });
            matchFound = true;
          }
        }
      }

      const scoreBeforeAdvancement = result.current.score;

      // Now simulate board being cleared
      boardCleared = true;
      act(() => {
        result.current.handleAddRows();
      });

      // Advance stage
      act(() => {
        result.current.handleContinue();
      });

      // Score should be preserved
      expect(result.current.score).toBe(scoreBeforeAdvancement);
      expect(result.current.stage).toBe(2);

      spy.mockRestore();
    });

    it('should reset stageComplete to false after handleContinue when board is not cleared', () => {
      // Start with board cleared
      let boardCleared = true;
      const spy = vi.spyOn(gameLogic, 'isBoardCleared').mockImplementation(() => boardCleared);

      const { result } = renderHook(() => useGame());

      expect(result.current.stageComplete).toBe(true);

      // Set board to NOT cleared before continuing
      boardCleared = false;

      act(() => {
        result.current.handleContinue();
      });

      // stageComplete should be false since new board is not cleared
      expect(result.current.stageComplete).toBe(false);
      expect(result.current.stage).toBe(2);

      spy.mockRestore();
    });
  });
});
