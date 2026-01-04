interface StageCompleteModalProps {
  stage: number;
  onContinue: () => void;
}

export function StageCompleteModal({ stage, onContinue }: StageCompleteModalProps) {
  return (
    <div className="modal-overlay" onClick={onContinue}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Stage {stage} Complete!</h2>
        <p className="modal-message">Great job! Ready for the next challenge?</p>
        <button className="btn btn-primary modal-button" onClick={onContinue}>
          Continue to Stage {stage + 1}
        </button>
      </div>
    </div>
  );
}
