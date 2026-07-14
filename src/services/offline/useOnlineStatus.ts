import { useEffect, useState } from 'react';

// Tracks navigator.onLine. Starts optimistic (true) to avoid an SSR/hydration
// mismatch — the effect corrects it on mount.
export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return online;
};
