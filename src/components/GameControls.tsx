interface GameControlsProps {
  addRowsRemaining: number;
  helpRemaining: number;
  showAddRowsHint: boolean;
  onAddRows: () => void;
  onHelp: () => void;
}

export function GameControls({
  addRowsRemaining,
  helpRemaining,
  showAddRowsHint,
  onAddRows,
  onHelp,
}: GameControlsProps) {
  const canAddRows = addRowsRemaining > 0;
  const canHelp = helpRemaining > 0;

  return (
    <div className="game-controls">
      <button
        className={`btn btn-secondary ${!canAddRows ? 'disabled' : ''} ${showAddRowsHint ? 'pulsing' : ''}`}
        onClick={onAddRows}
        disabled={!canAddRows}
        aria-label={`Add rows (${addRowsRemaining} remaining)`}
      >
        ➕ {addRowsRemaining}
      </button>
      <button
        className={`btn btn-help ${!canHelp ? 'disabled' : ''}`}
        onClick={onHelp}
        disabled={!canHelp}
        aria-label={`Help (${helpRemaining} remaining)`}
      >
        ❓ {helpRemaining}
      </button>
    </div>
  );
}
