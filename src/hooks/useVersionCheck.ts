import { useState, useEffect, useCallback } from 'react';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes
const VERSION_FILE = 'version.json';

interface VersionInfo {
  version: string;
  buildTime: string;
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion] = useState<string>(__GIT_COMMIT__);

  const checkForUpdate = useCallback(async () => {
    try {
      // Add cache-busting query param
      const response = await fetch(`${import.meta.env.BASE_URL}${VERSION_FILE}?t=${Date.now()}`);
      if (!response.ok) return;

      const data: VersionInfo = await response.json();

      if (data.version !== currentVersion) {
        setUpdateAvailable(true);
      }
    } catch {
      // Silently fail - network issues shouldn't break the game
    }
  }, [currentVersion]);

  const reloadApp = useCallback(() => {
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkForUpdate();

    // Then check periodically
    const interval = setInterval(checkForUpdate, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkForUpdate]);

  return {
    updateAvailable,
    reloadApp,
    dismissUpdate,
  };
}
