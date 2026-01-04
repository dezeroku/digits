interface GameOverModalProps {
  score: number;
  isHighScore: boolean;
  onRestart: () => void;
}

export function GameOverModal({ score, isHighScore, onRestart }: GameOverModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className={`modal-title ${isHighScore ? '' : 'modal-title-warning'}`}>
          {isHighScore ? 'New High Score!' : 'Game Over'}
        </h2>
        <div className="game-over-score">
          <span className="game-over-label">Final Score</span>
          <span className={`game-over-value ${isHighScore ? 'high-score' : ''}`}>
            {score}
          </span>
          {isHighScore && <span className="high-score-badge">🏆 #1</span>}
        </div>
        <p className="modal-message">
          {isHighScore
            ? 'Congratulations! You achieved the top score!'
            : 'No more moves available.'}
        </p>
        <button className="btn btn-primary modal-button" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}
