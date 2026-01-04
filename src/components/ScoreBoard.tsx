interface ScoreBoardProps {
  score: number;
}

export function ScoreBoard({ score }: ScoreBoardProps) {
  return (
    <div className="scoreboard">
      <span className="score-label">Score:</span>
      <span className="score-value">{score}</span>
    </div>
  );
}
