export interface ScoreEntry {
  score: number;
  date: string; // ISO format
  stage?: number; // Stage reached (optional for backward compatibility)
}

const STORAGE_KEY = 'digits-top-scores';
const MAX_SCORES = 5;

/**
 * Get top scores from localStorage
 */
export function getTopScores(): ScoreEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ScoreEntry[];
  } catch {
    return [];
  }
}

/**
 * Check if a score qualifies for the top scores list
 */
export function isTopScore(score: number): boolean {
  if (score <= 0) return false;
  const scores = getTopScores();
  if (scores.length < MAX_SCORES) return true;
  return score > scores[scores.length - 1].score;
}

/**
 * Add a score to the top scores list if it qualifies
 * Returns true if the score was added
 */
export function addScore(score: number, stage?: number): boolean {
  if (score <= 0) return false;

  const scores = getTopScores();
  const newEntry: ScoreEntry = {
    score,
    date: new Date().toISOString(),
    stage,
  };

  // Add new score and sort
  scores.push(newEntry);
  scores.sort((a, b) => b.score - a.score);

  // Keep only top scores
  const topScores = scores.slice(0, MAX_SCORES);

  // Check if our score made it
  const wasAdded = topScores.some(
    (entry) => entry.score === newEntry.score && entry.date === newEntry.date
  );

  if (wasAdded) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topScores));
    } catch {
      // Storage might be full or disabled
      return false;
    }
  }

  return wasAdded;
}

/**
 * Format a date string for display
 */
export function formatScoreDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
