import { prod } from '../helpers';

// Opt-in flag to run the service worker in `next dev`. Set it in the console:
//   localStorage.setItem('enableServiceWorkerInDev', 'true')
// then reload. Turn it off (and unregister in DevTools > Application) when done
// — in dev the SW cache-firsts /_next/static, which can serve stale HMR chunks.
const DEV_SW_FLAG = 'enableServiceWorkerInDev';

const shouldRegister = (): boolean => {
  if (prod) return true;
  try {
    return localStorage.getItem(DEV_SW_FLAG) === 'true';
  } catch {
    return false;
  }
};

/**
 * Registers /sw.js. In production always; in `next dev` only when the
 * `enableServiceWorkerInDev` localStorage flag is set (the SW otherwise fights
 * with HMR). Offline support does nothing without this — nothing serves the
 * downloaded Cache Storage entries unless the SW is active.
 */
export const registerServiceWorker = (): void => {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  if (!shouldRegister()) {
    if (!prod) {
      // Self-heal: a SW registered during an earlier opt-in stays active even
      // after the flag is removed, and would keep serving stale dev chunks.
      // Unregister any leftover so dev hydration isn't broken.
      navigator.serviceWorker.getRegistrations?.().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
      // eslint-disable-next-line no-console
      console.info(
        `[offline] Service worker disabled in dev. To test offline, run \`localStorage.setItem('${DEV_SW_FLAG}','true')\` and reload — or use \`npm run build && npm start\`.`,
      );
    }
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      // updateViaCache: 'none' — always check for a new sw.js over the network,
      // so a fixed SW reaches devices even if the old one was HTTP-cached.
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        registration.update().catch(() => {});
        // Warm the app shell (/ + its entry chunks) from the window on every
        // online start — the reliable write path on iOS. Guarantees a cold
        // OFFLINE launch finds a bootable shell even if the SW-side precache
        // was killed mid-way.
        if (navigator.onLine) {
          setTimeout(() => {
            import('./offlineCache').then(({ warmAppShell }) => warmAppShell());
          }, 3000); // after startup work, don't compete with initial requests
        }
      })
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn('Service worker registration failed:', e);
      });
  });
};
