interface GameControlsProps {
  addRowsRemaining: number;
  onNewGame: () => void;
  onAddRows: () => void;
  onTopScores: () => void;
}

export function GameControls({
  addRowsRemaining,
  onNewGame,
  onAddRows,
  onTopScores,
}: GameControlsProps) {
  const canAddRows = addRowsRemaining > 0;

  return (
    <div className="game-controls">
      <button className="btn btn-primary" onClick={onNewGame}>
        New Game
      </button>
      <button
        className={`btn btn-secondary ${!canAddRows ? 'disabled' : ''}`}
        onClick={onAddRows}
        disabled={!canAddRows}
      >
        Add Rows ({addRowsRemaining})
      </button>
      <button className="btn btn-tertiary" onClick={onTopScores}>
        Top Scores
      </button>
    </div>
  );
}
