/* eslint-disable no-console */
import React from 'react';
import { isDebugModeEnabled } from '../utils/debugStorage';

/**
 * Crash overlay – umožní PŘEČÍST chybu na telefonu, kde není konzole.
 *
 * Když appka spadne (Next.js u client-side výjimky zobrazí v <title> jen
 * "Application error"), tenhle overlay vykreslí skutečnou chybu + stack +
 * kontext (JSON) přímo do <body> a překryje všechno ostatní.
 *
 * Zachytává chyby ze tří zdrojů:
 *  1) React render chyby přes <CrashErrorBoundary>
 *  2) window 'error' a 'unhandledrejection' (globální / async chyby)
 *  3) změnu document.title na "Application error" (fallback, když už React
 *     strom unmountoval a náš boundary se k chybě nedostal)
 *
 * Overlay je čistý DOM (žádné MUI/téma/intl), aby fungoval i v případě, že je
 * rozbitá právě tahle vrstva.
 */

const OVERLAY_ID = 'crash-overlay-root';

type CrashEntry = {
  source: string;
  name?: string;
  message: string;
  stack?: string;
  componentStack?: string;
  time: string;
};

const entries: CrashEntry[] = [];
let titleWatcherStarted = false;

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

// Overlay je defaultně vypnutý, aby nepodstatné chyby (AbortError, 500 z
// pomocných API apod.) nepřebíraly obrazovku. Řídí se jednotným debug módem
// (6× klik na avatar v sidebaru, nebo Ctrl+Shift+D) – viz utils/debug.
export const isCrashDebugEnabled = (): boolean => isDebugModeEnabled();

const buildContext = (): Record<string, unknown> => {
  try {
    return {
      time: new Date().toISOString(),
      href: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer || null,
      title: document.title,
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      screen: { w: window.screen?.width, h: window.screen?.height },
      devicePixelRatio: window.devicePixelRatio,
      standalonePWA: safe(
        () => window.matchMedia('(display-mode: standalone)').matches,
        null,
      ),
      // Nastavení uživatele bývá častá příčina pádů (např. gradeSystem).
      userSettings: safe(
        () => JSON.parse(localStorage.getItem('userSettings') || 'null'),
        '<unreadable>',
      ),
      localStorageKeys: safe(
        () => Object.keys(localStorage) as unknown,
        '<unreadable>',
      ),
      appVersion: process.env.osmappVersion ?? null,
    };
  } catch (e) {
    return { error: 'context unavailable', detail: String(e) };
  }
};

const buildReport = () => ({
  errors: entries,
  context: buildContext(),
});

const reportText = () => {
  const json = safe(() => JSON.stringify(buildReport(), null, 2), '{}');
  return json;
};

const recordEntry = (entry: CrashEntry) => {
  // dedupe podle message+stack, ať se to nemnoží
  const key = `${entry.message}|${entry.stack ?? ''}`;
  if (entries.some((e) => `${e.message}|${e.stack ?? ''}` === key)) {
    return;
  }
  entries.push(entry);
  console.error('[crashOverlay]', entry.source, entry.message, entry);
};

/**
 * Zaznamená React chybu zachycenou lokálním error boundary (např. kolem
 * FeaturePanelu). Chyba se do window 'error' nedostane (boundary ji pohltí),
 * takže ji musíme do reportu poslat ručně – ať ji v debug módu vidíme stejně
 * jako pády zachycené globálním <CrashErrorBoundary>.
 */
export const reportReactError = (
  source: string,
  error: unknown,
  componentStack?: string,
) => {
  const err = error as { name?: string; message?: string; stack?: string };
  recordEntry({
    source,
    name: err?.name,
    message: err?.message || String(error),
    stack: err?.stack,
    componentStack,
    time: new Date().toISOString(),
  });
  renderVanillaOverlay();
};

// ---------------------------------------------------------------------------
// Vanilla DOM overlay (funguje i po unmountu Reactu)
// ---------------------------------------------------------------------------

const renderVanillaOverlay = () => {
  if (typeof document === 'undefined' || !document.body) return;
  if (entries.length === 0) return;
  if (!isCrashDebugEnabled()) return;

  let root = document.getElementById(OVERLAY_ID);
  if (!root) {
    root = document.createElement('div');
    root.id = OVERLAY_ID;
    root.setAttribute(
      'style',
      [
        'position:fixed',
        'inset:0',
        'z-index:2147483647',
        'background:#0b0b0c',
        'color:#f5f5f5',
        'font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace',
        'padding:12px',
        'overflow:auto',
        '-webkit-overflow-scrolling:touch',
        'overscroll-behavior:contain',
        'white-space:pre-wrap',
        'word-break:break-word',
      ].join(';'),
    );
    document.body.appendChild(root);
  }

  const text = reportText();
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  root.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
      <strong style="color:#ff6b6b;font-size:15px">⚠ APP CRASH</strong>
      <button id="crash-copy" style="appearance:none;border:1px solid #888;background:#1f6feb;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px">Kopírovat</button>
      <button id="crash-reload" style="appearance:none;border:1px solid #888;background:#333;color:#fff;padding:6px 12px;border-radius:6px;font-size:13px">Reload</button>
    </div>
    <div style="color:#ffd479;margin-bottom:8px">${entries.length} error(s). Zkopíruj a pošli mi tenhle text:</div>
    <pre style="margin:0;white-space:pre-wrap;word-break:break-word">${escaped}</pre>
  `;

  const copyBtn = document.getElementById('crash-copy');
  copyBtn?.addEventListener('click', () => {
    const t = reportText();
    const done = () => {
      copyBtn.textContent = 'Zkopírováno ✓';
    };
    safe(
      () => navigator.clipboard.writeText(t).then(done, () => {}),
      undefined,
    );
    // fallback výběr textu
    safe(() => {
      const range = document.createRange();
      const pre = root!.querySelector('pre');
      if (pre) {
        range.selectNodeContents(pre);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand('copy');
        done();
      }
    }, undefined);
  });
  document.getElementById('crash-reload')?.addEventListener('click', () => {
    safe(() => window.location.reload(), undefined);
  });
};

const startTitleWatcher = () => {
  if (titleWatcherStarted || typeof document === 'undefined') return;
  titleWatcherStarted = true;

  const check = () => {
    if (/application error/i.test(document.title)) {
      if (entries.length === 0) {
        recordEntry({
          source: 'title-watch',
          message:
            'document.title = "Application error" (Next.js client-side exception). Detailní chyba viz window error níže, případně konzole.',
          time: new Date().toISOString(),
        });
      }
      renderVanillaOverlay();
    }
  };

  const titleEl = document.querySelector('title');
  if (titleEl && typeof MutationObserver !== 'undefined') {
    new MutationObserver(check).observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }
  setInterval(check, 500);
  check();
};

/** Zavolat jednou na klientu (z _app). */
export const initCrashOverlay = () => {
  if (typeof window === 'undefined') return;
  if ((window as any).__crashOverlayInit) return;
  (window as any).__crashOverlayInit = true;

  window.addEventListener('error', (e: ErrorEvent) => {
    recordEntry({
      source: 'window.error',
      name: e.error?.name,
      message: e.message || String(e.error) || 'Unknown error',
      stack: e.error?.stack,
      time: new Date().toISOString(),
    });
    renderVanillaOverlay();
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const r: any = e.reason;
    recordEntry({
      source: 'unhandledrejection',
      name: r?.name,
      message: r?.message || String(r) || 'Unknown rejection',
      stack: r?.stack,
      time: new Date().toISOString(),
    });
    renderVanillaOverlay();
  });

  startTitleWatcher();
};

// ---------------------------------------------------------------------------
// React Error Boundary – chytí render chyby a vykreslí stejný overlay
// ---------------------------------------------------------------------------

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class CrashErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    // Mimo debug režim chybu "nechytáme" – stav nenastavíme, React ji
    // propaguje dál (běžné Next chování). V debug režimu ji zobrazíme.
    return { hasError: isCrashDebugEnabled() };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    recordEntry({
      source: 'react-boundary',
      name: error?.name,
      message: error?.message || String(error),
      stack: error?.stack,
      componentStack: info?.componentStack ?? undefined,
      time: new Date().toISOString(),
    });
    renderVanillaOverlay();
  }

  render() {
    if (this.state.hasError) {
      // React fallback (kdyby vanilla overlay z nějakého důvodu nešel)
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483646,
            background: '#0b0b0c',
            color: '#f5f5f5',
            font: '12px/1.45 ui-monospace, Menlo, Consolas, monospace',
            padding: 12,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <div style={{ color: '#ff6b6b', fontSize: 15, marginBottom: 8 }}>
            ⚠ APP CRASH
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {reportText()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
