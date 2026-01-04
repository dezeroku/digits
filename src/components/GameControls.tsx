interface GameControlsProps {
  addRowsRemaining: number;
  helpRemaining: number;
  showAddRowsHint: boolean;
  onNewGame: () => void;
  onAddRows: () => void;
  onTopScores: () => void;
  onHelp: () => void;
}

export function GameControls({
  addRowsRemaining,
  helpRemaining,
  showAddRowsHint,
  onNewGame,
  onAddRows,
  onTopScores,
  onHelp,
}: GameControlsProps) {
  const canAddRows = addRowsRemaining > 0;
  const canHelp = helpRemaining > 0;

  return (
    <div className="game-controls">
      <button className="btn btn-primary" onClick={onNewGame}>
        New Game
      </button>
      <button
        className={`btn btn-secondary ${!canAddRows ? 'disabled' : ''} ${showAddRowsHint ? 'pulsing' : ''}`}
        onClick={onAddRows}
        disabled={!canAddRows}
      >
        Add Rows ({addRowsRemaining})
      </button>
      <button
        className={`btn btn-help ${!canHelp ? 'disabled' : ''}`}
        onClick={onHelp}
        disabled={!canHelp}
      >
        Help ({helpRemaining})
      </button>
      <button className="btn btn-tertiary" onClick={onTopScores}>
        Top Scores
      </button>
    </div>
  );
}
