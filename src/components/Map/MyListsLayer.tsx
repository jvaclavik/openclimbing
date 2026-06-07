import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import Router from 'next/router';
import { useMyListsContext } from '../utils/MyListsContext';
import { getGlobalMap } from '../../services/mapStorage';
import { getApiId, getUrlOsmId } from '../../services/helpers';
import { DEFAULT_LIST_COLOR } from '../../services/my-lists/listColors';

const buildMarkerElement = (
  emoji: string,
  color: string,
  title: string,
): HTMLDivElement => {
  const el = document.createElement('div');
  el.setAttribute('role', 'button');
  el.setAttribute('aria-label', title);
  el.style.cssText = [
    'width: 28px',
    'height: 28px',
    'border-radius: 50%',
    `background: ${color}`,
    'box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35)',
    'display: flex',
    'align-items: center',
    'justify-content: center',
    'font-size: 17px',
    'line-height: 1',
    'cursor: pointer',
    'transform: translateY(-4px)',
    'border: 1.5px solid rgba(0, 0, 0, 0.25)',
  ].join(';');
  el.textContent = emoji;
  return el;
};

const navigateToItem = (shortId: string) => {
  try {
    const apiId = getApiId(shortId);
    if (apiId.type) {
      Router.push(`/${getUrlOsmId(apiId)}`);
    }
  } catch {
    // ignore
  }
};

export const MyListsLayer = () => {
  const { lists, visibleListIds } = useMyListsContext();

  useEffect(() => {
    const map = getGlobalMap();
    if (!map || !lists) return undefined;

    const markers: maplibregl.Marker[] = [];

    for (const list of lists) {
      if (!visibleListIds.includes(list.id)) continue;
      for (const item of list.items) {
        if (
          !item.center ||
          !Number.isFinite(item.center[0]) ||
          !Number.isFinite(item.center[1])
        ) {
          continue;
        }
        const el = buildMarkerElement(
          list.emoji?.trim() ?? '',
          list.color || DEFAULT_LIST_COLOR,
          `${list.name}: ${item.label}`,
        );
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          navigateToItem(item.shortId);
        });
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(item.center)
          .addTo(map);
        markers.push(marker);
      }
    }

    return () => {
      for (const marker of markers) {
        marker.remove();
      }
    };
  }, [lists, visibleListIds]);

  return null;
};
