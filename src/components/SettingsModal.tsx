import { Settings } from '../hooks/useSettings';

interface SettingsModalProps {
  settings: Settings;
  onToggleSound: () => void;
  onToggleAnimations: () => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onToggleSound,
  onToggleAnimations,
  onClose,
}: SettingsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-settings" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Settings</h2>

        <div className="settings-list">
          <div className="settings-item">
            <div className="settings-label">
              <span className="settings-icon">🔊</span>
              <span>Sound Effects</span>
            </div>
            <button
              className={`toggle-switch ${settings.soundEnabled ? 'on' : 'off'}`}
              onClick={onToggleSound}
              aria-label={settings.soundEnabled ? 'Disable sounds' : 'Enable sounds'}
            >
              <span className="toggle-knob" />
            </button>
          </div>

          <div className="settings-item">
            <div className="settings-label">
              <span className="settings-icon">✨</span>
              <span>Animations</span>
            </div>
            <button
              className={`toggle-switch ${settings.animationsEnabled ? 'on' : 'off'}`}
              onClick={onToggleAnimations}
              aria-label={settings.animationsEnabled ? 'Disable animations' : 'Enable animations'}
            >
              <span className="toggle-knob" />
            </button>
          </div>
        </div>

        <button className="btn btn-primary modal-button" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
