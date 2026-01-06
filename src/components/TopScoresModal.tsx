import { ScoreEntry, formatScoreDate } from '../utils/scoreStorage';

interface TopScoresModalProps {
  scores: ScoreEntry[];
  onClose: () => void;
}

function getMedalEmoji(rank: number): string | null {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
}

export function TopScoresModal({ scores, onClose }: TopScoresModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-scores" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Top Scores</h2>
        {scores.length === 0 ? (
          <p className="modal-message">No scores yet. Start playing!</p>
        ) : (
          <div className="scores-list">
            {scores.map((entry, index) => {
              const medal = getMedalEmoji(index + 1);
              return (
                <div key={`${entry.date}-${index}`} className="score-entry">
                  <div className="score-entry-main">
                    <span className="score-rank">
                      {medal ?? `#${index + 1}`}
                    </span>
                    <span className="score-points">{entry.score.toLocaleString()}</span>
                  </div>
                  <div className="score-entry-meta">
                    {entry.stage !== undefined && (
                      <span className="score-stage">Stage {entry.stage}</span>
                    )}
                    <span className="score-date">{formatScoreDate(entry.date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className="btn btn-primary modal-button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
