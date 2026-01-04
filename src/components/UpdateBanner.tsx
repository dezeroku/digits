interface UpdateBannerProps {
  onReload: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ onReload, onDismiss }: UpdateBannerProps) {
  return (
    <div className="update-banner">
      <span className="update-message">A new version is available!</span>
      <div className="update-actions">
        <button className="btn btn-secondary btn-small" onClick={onReload}>
          Update Now
        </button>
        <button className="btn-dismiss" onClick={onDismiss} aria-label="Dismiss">
          &times;
        </button>
      </div>
    </div>
  );
}
