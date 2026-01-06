import { useState, useEffect, useCallback, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  // Register service worker and set up update detection
  useEffect(() => {
    const updateSW = registerSW({
      // Called when a new service worker is available
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      // Called when the app is ready to work offline
      onOfflineReady() {
        console.log('App ready for offline use');
      },
      // Check for updates periodically
      onRegisteredSW(_swUrl, registration) {
        if (registration) {
          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, CHECK_INTERVAL_MS);
        }
      },
    });

    updateSWRef.current = updateSW;
  }, []);

  const reloadApp = useCallback(async () => {
    if (updateSWRef.current) {
      // Tell the service worker to skip waiting and activate
      await updateSWRef.current(true);
    } else {
      // Fallback: force reload bypassing cache
      window.location.reload();
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return {
    updateAvailable,
    reloadApp,
    dismissUpdate,
  };
}
