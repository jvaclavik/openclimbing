import React, { useEffect, useRef } from 'react';
import { t } from '../../../../services/intl';

const SNAP_DEGREES = 15;

/** 0° is north. Positive angles go clockwise. */
export const wrapBearing = (degrees: number) => {
  const rounded = Math.round(degrees);
  return ((rounded % 360) + 360) % 360;
};

export const snapBearing = (degrees: number, step = SNAP_DEGREES) =>
  wrapBearing(Math.round(degrees / step) * step);

/** Screen delta from the dial center: x right, y down. */
export const pointerToBearing = (dx: number, dy: number) =>
  snapBearing((Math.atan2(dx, -dy) * 180) / Math.PI);

export const stepBearing = (bearing: number | null, delta: number) =>
  wrapBearing((bearing ?? 0) + delta);

type RotationHandle = {
  element: HTMLElement;
  setBearing: (bearing: number | null | undefined) => void;
};

const svgIcon = (paths: string) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.display = 'block';
  const stroke = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  stroke.setAttribute('fill', 'none');
  stroke.setAttribute('stroke', 'currentColor');
  stroke.setAttribute('stroke-width', '1.8');
  stroke.setAttribute('stroke-linecap', 'round');
  stroke.setAttribute('stroke-linejoin', 'round');
  stroke.innerHTML = paths;
  svg.appendChild(stroke);
  return svg;
};

const stopControlEvent = (event: Event) => {
  event.preventDefault();
  event.stopPropagation();
};

export const createPitchRotationControl = (
  initial: number | null | undefined,
  onChange: (bearing: number | null) => void,
  caption?: string,
): RotationHandle => {
  let current: number | null = initial == null ? null : wrapBearing(initial);

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display:flex;flex-direction:column;align-items:center;gap:8px;touch-action:none;user-select:none;';

  if (caption) {
    const label = document.createElement('div');
    label.textContent = caption;
    label.style.cssText =
      'align-self:stretch;font:500 11px/1.3 sans-serif;color:#666;';
    wrap.appendChild(label);
  }

  const dialSize = 112;
  const handleSize = 28;
  const radius = dialSize / 2 - handleSize / 2 - 2;

  const dial = document.createElement('div');
  dial.setAttribute('role', 'slider');
  dial.setAttribute(
    'aria-label',
    caption || t('editdialog.multipitch_direction'),
  );
  dial.setAttribute('aria-valuemin', '0');
  dial.setAttribute('aria-valuemax', '359');
  dial.style.cssText = `
    position: relative;
    width: ${dialSize}px;
    height: ${dialSize}px;
    touch-action: none;
    cursor: grab;
  `;

  const ring = document.createElement('div');
  ring.style.cssText = `
    position: absolute;
    inset: 10px;
    border-radius: 50%;
    box-sizing: border-box;
    border: 12px solid #e4e4e7;
    background: #fff;
    pointer-events: none;
  `;

  const handle = document.createElement('div');
  handle.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    width: ${handleSize}px;
    height: ${handleSize}px;
    border-radius: 50%;
    background: #3b82f6;
    box-shadow: 0 1px 3px rgba(0,0,0,0.35);
    pointer-events: none;
  `;

  const readout = document.createElement('div');
  readout.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 600 16px/1 sans-serif;
    color: #222;
    pointer-events: none;
  `;

  dial.append(ring, handle, readout);

  const paint = () => {
    readout.textContent = current == null ? '—' : `${current}°`;
    dial.setAttribute('aria-valuenow', current == null ? '0' : String(current));
    dial.setAttribute(
      'aria-valuetext',
      current == null ? t('editdialog.multipitch_stacked') : `${current}°`,
    );
    if (current == null) {
      handle.style.opacity = '0';
      return;
    }
    const rad = (current * Math.PI) / 180;
    const x = dialSize / 2 + radius * Math.sin(rad) - handleSize / 2;
    const y = dialSize / 2 - radius * Math.cos(rad) - handleSize / 2;
    handle.style.opacity = '1';
    handle.style.transform = `translate(${x}px, ${y}px)`;
  };

  const commit = (next: number | null) => {
    if (next === current) return;
    current = next;
    paint();
    onChange(next);
  };

  const applyFromPoint = (clientX: number, clientY: number) => {
    const rect = dial.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    if (dx * dx + dy * dy < 16) return;
    commit(pointerToBearing(dx, dy));
  };

  let activePointer: number | null = null;
  const onMove = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    event.preventDefault();
    applyFromPoint(event.clientX, event.clientY);
  };
  const endDrag = (event: PointerEvent) => {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    dial.style.cursor = 'grab';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
  };
  dial.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    stopControlEvent(event);
    activePointer = event.pointerId;
    dial.style.cursor = 'grabbing';
    applyFromPoint(event.clientX, event.clientY);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    try {
      dial.setPointerCapture(event.pointerId);
    } catch {
      // Touch emulation can reject capture; window listeners still track the finger.
    }
  });

  const buttonRow = document.createElement('div');
  buttonRow.style.cssText = 'display:flex;gap:8px;';

  const makeButton = (
    label: string,
    icon: SVGSVGElement,
    onClick: () => void,
    hint?: string,
  ) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = label;
    button.setAttribute('aria-label', label);
    button.style.cssText = `
      width: 48px;
      height: 48px;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      border-radius: 12px;
      border: 1px solid #ddd;
      background: #fff;
      color: #222;
      cursor: pointer;
      touch-action: manipulation;
    `;
    button.appendChild(icon);
    if (hint) {
      const hintEl = document.createElement('span');
      hintEl.textContent = hint;
      hintEl.style.cssText = 'font:600 10px/1 sans-serif;';
      button.appendChild(hintEl);
    }
    button.addEventListener('pointerdown', (event) => {
      event.stopPropagation();
    });
    button.addEventListener('click', (event) => {
      stopControlEvent(event);
      onClick();
    });
    return button;
  };

  buttonRow.append(
    makeButton(
      t('editdialog.multipitch_rotate_left'),
      svgIcon('<path d="M8 9.2a5 5 0 1 0 1.4-3.5"/><path d="M8 4.2V8.2h4"/>'),
      () => commit(stepBearing(current, -45)),
      '45°',
    ),
    makeButton(
      t('editdialog.multipitch_stacked'),
      svgIcon('<path d="M5 12a7 7 0 1 0 2-4.9"/><path d="M5 4.5V9h4.5"/>'),
      () => commit(null),
    ),
    makeButton(
      t('editdialog.multipitch_rotate_right'),
      svgIcon(
        '<path d="M16 9.2a5 5 0 1 1-1.4-3.5"/><path d="M16 4.2V8.2h-4"/>',
      ),
      () => commit(stepBearing(current, 45)),
      '45°',
    ),
  );

  wrap.append(dial, buttonRow);
  paint();

  return {
    element: wrap,
    setBearing: (bearing) => {
      const next = bearing == null ? null : wrapBearing(bearing);
      if (next === current) return;
      current = next;
      paint();
    },
  };
};

export const PitchRotationControl: React.FC<{
  bearing: number | null | undefined;
  onChange: (bearing: number | null) => void;
}> = ({ bearing, onChange }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const controlRef = useRef<RotationHandle | null>(null);
  onChangeRef.current = onChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const control = createPitchRotationControl(bearing, (next) =>
      onChangeRef.current(next),
    );
    controlRef.current = control;
    host.replaceChildren(control.element);
    return () => {
      controlRef.current = null;
      host.replaceChildren();
    };
    // The dial keeps its own state while dragging; later prop updates go through setBearing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    controlRef.current?.setBearing(bearing);
  }, [bearing]);

  return <div ref={hostRef} />;
};
