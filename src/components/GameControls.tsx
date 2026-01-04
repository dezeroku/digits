interface GameControlsProps {
  onNewGame: () => void;
  onAddRows: () => void;
}

export function GameControls({ onNewGame, onAddRows }: GameControlsProps) {
  return (
    <div className="game-controls">
      <button className="btn btn-primary" onClick={onNewGame}>
        New Game
      </button>
      <button className="btn btn-secondary" onClick={onAddRows}>
        Add Rows
      </button>
    </div>
  );
}
