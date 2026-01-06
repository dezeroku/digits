import { Board } from '../types';

const STORAGE_KEY = 'digits-game-state';
const STATE_VERSION = 1;

export interface SavedGameState {
  version: number;
  board: Board;
  score: number;
  stage: number;
  addRowsRemaining: number;
  helpRemaining: number;
  digitUsage: Record<number, number>;
  stageComplete: boolean;
  gameOver: boolean;
  savedAt: string; // ISO timestamp
}

/**
 * Save game state to localStorage
 */
export function saveGameState(state: Omit<SavedGameState, 'version' | 'savedAt'>): void {
  try {
    const saveData: SavedGameState = {
      ...state,
      version: STATE_VERSION,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  } catch {
    // Storage might be full or disabled - silently fail
  }
}

/**
 * Load game state from localStorage
 * Returns null if no valid state exists
 */
export function loadGameState(): SavedGameState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as SavedGameState;

    // Version check - reject incompatible versions
    if (state.version !== STATE_VERSION) {
      clearGameState();
      return null;
    }

    // Basic validation
    if (!state.board || !Array.isArray(state.board) || state.board.length === 0) {
      clearGameState();
      return null;
    }

    return state;
  } catch {
    clearGameState();
    return null;
  }
}

/**
 * Clear saved game state
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Check if there's a saved game state
 */
export function hasSavedGameState(): boolean {
  return loadGameState() !== null;
}
