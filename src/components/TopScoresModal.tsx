import { ScoreEntry, formatScoreDate } from '../utils/scoreStorage';

interface TopScoresModalProps {
  scores: ScoreEntry[];
  onClose: () => void;
}

export function TopScoresModal({ scores, onClose }: TopScoresModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Top Scores</h2>
        {scores.length === 0 ? (
          <p className="modal-message">No scores yet. Start playing!</p>
        ) : (
          <div className="scores-list">
            {scores.map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="score-entry">
                <span className="score-rank">#{index + 1}</span>
                <span className="score-points">{entry.score}</span>
                <span className="score-date">{formatScoreDate(entry.date)}</span>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-primary modal-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
