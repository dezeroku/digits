import { useState, useCallback, useEffect } from 'react';

const SETTINGS_KEY = 'digits-settings';

export interface Settings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  animationsEnabled: true,
};

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    // Ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    // Ignore storage errors
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Persist settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const toggleSound = useCallback(() => {
    setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }));
  }, []);

  const toggleAnimations = useCallback(() => {
    setSettings((s) => ({ ...s, animationsEnabled: !s.animationsEnabled }));
  }, []);

  return {
    settings,
    toggleSound,
    toggleAnimations,
  };
}
