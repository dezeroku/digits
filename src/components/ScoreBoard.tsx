interface ScoreBoardProps {
  score: number;
  onTopScores: () => void;
}

export function ScoreBoard({ score, onTopScores }: ScoreBoardProps) {
  return (
    <button
      className="scoreboard"
      onClick={onTopScores}
      aria-label="View top scores"
      title="View top scores"
    >
      <span className="score-icon">🏆</span>
      <span className="score-value">{score}</span>
    </button>
  );
}
