interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-welcome" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Welcome to Digits!</h2>
        <div className="welcome-rules">
          <div className="welcome-rule">
            <span className="welcome-icon">🎯</span>
            <p>Match pairs of digits that are <strong>equal</strong> or <strong>sum to 10</strong></p>
          </div>
          <div className="welcome-rule">
            <span className="welcome-icon">📏</span>
            <p>The path between digits must be clear (horizontal, vertical, diagonal, or wrap-around)</p>
          </div>
          <div className="welcome-rule">
            <span className="welcome-icon">⭐</span>
            <p>Distant matches earn bonus points!</p>
          </div>
          <div className="welcome-rule">
            <span className="welcome-icon">🧹</span>
            <p>Clear entire rows to remove them from the board</p>
          </div>
          <div className="welcome-rule">
            <span className="welcome-icon">🏆</span>
            <p>Clear all digits to complete the stage</p>
          </div>
        </div>
        <button className="btn btn-primary modal-button" onClick={onClose}>
          Let's Play!
        </button>
      </div>
    </div>
  );
}
