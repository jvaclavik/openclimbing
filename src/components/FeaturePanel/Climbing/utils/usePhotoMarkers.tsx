import { useEffect, useRef } from 'react';
import maplibregl, { LngLatLike } from 'maplibre-gl';
import ReactDOMServer from 'react-dom/server';
import { CameraMarker } from '../CameraMarker';
import { getPhotoGps, PhotoExifs } from './usePhotoExifGps';
import { photoNameKey } from './photo';
import { getCommonsImageUrl } from '../../../../services/images/getCommonsImageUrl';

const createMarkerElement = (
  index: number,
  azimuth: number | null,
  fov: number | null,
  active: boolean,
  onClick: () => void,
): HTMLDivElement | undefined => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return undefined;
  }
  const el = document.createElement('div');
  el.style.cursor = 'pointer';
  el.innerHTML = ReactDOMServer.renderToStaticMarkup(
    <CameraMarker
      width={36}
      index={index}
      azimuth={azimuth}
      fov={fov}
      active={active}
    />,
  );
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return el;
};

// markers are too cluttered when zoomed out — only show them past this zoom
const DEFAULT_MIN_ZOOM = 17.5;
// how long to hover a marker before its photo preview pops up
const HOVER_DELAY_MS = 500;
// horizontal gap (px) between markers that share the same GPS spot
const SAME_SPOT_SPACING_PX = 30;

type Options = {
  /** photo name (without `File:`) that should be rendered as active/highlighted */
  activePhoto?: string | null;
  /** called with the photo name (without `File:`) when a marker is clicked */
  onPhotoClick?: (photoName: string) => void;
  /** markers are hidden at this zoom and below (default 17.5) */
  minZoom?: number;
};

/**
 * Renders one clickable camera marker per photo that has GPS coordinates in
 * its EXIF metadata. Markers are numbered by the photo's position in
 * `photoNames` (the same order as the feature panel image strip), so marker
 * "3" always points at the third photo — even if some photos in between have
 * no GPS and thus no marker. Hovering a marker pops up a preview of the photo.
 *
 * Shared by the in-dialog `CragMap` and the main-map crag photo layer so both
 * look and behave the same.
 */
export const usePhotoMarkers = (
  map: maplibregl.Map | null | undefined,
  photoExifs: PhotoExifs,
  photoNames: Array<string>,
  { activePhoto, onPhotoClick, minZoom = DEFAULT_MIN_ZOOM }: Options = {},
) => {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const photoNamesKey = photoNames.join('|');

  useEffect(() => {
    if (!map) return undefined;

    // index EXIF entries (keyed by canonical Commons title) by normalized name
    const exifByName: PhotoExifs = {};
    Object.keys(photoExifs).forEach((title) => {
      exifByName[photoNameKey(title)] = photoExifs[title];
    });

    const openPopups = new Set<maplibregl.Popup>();
    const hoverTimers = new Set<ReturnType<typeof setTimeout>>();

    const clearMarkers = () => {
      hoverTimers.forEach((timer) => clearTimeout(timer));
      hoverTimers.clear();
      openPopups.forEach((popup) => popup.remove());
      openPopups.clear();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };

    const addHoverPreview = (
      element: HTMLElement,
      photoName: string,
      lngLat: LngLatLike,
    ) => {
      const url = getCommonsImageUrl(`File:${photoName}`, 250);
      if (!url) return;
      let timer: ReturnType<typeof setTimeout> | null = null;
      let popup: maplibregl.Popup | null = null;

      const hide = () => {
        if (timer) {
          clearTimeout(timer);
          hoverTimers.delete(timer);
          timer = null;
        }
        if (popup) {
          popup.remove();
          openPopups.delete(popup);
          popup = null;
        }
      };

      element.addEventListener('mouseenter', () => {
        timer = setTimeout(() => {
          popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 22,
            maxWidth: '260px',
            className: 'crag-photo-popup',
          })
            .setLngLat(lngLat)
            .setHTML(
              `<img src="${url}" alt="" style="display:block;width:240px;height:auto;border-radius:4px" />`,
            )
            .addTo(map);
          openPopups.add(popup);
        }, HOVER_DELAY_MS);
        hoverTimers.add(timer);
      });
      element.addEventListener('mouseleave', hide);
    };

    const buildMarkers = () => {
      // photos with GPS, in strip order
      const withGps: Array<{
        photoName: string;
        number: number;
        gps: NonNullable<ReturnType<typeof getPhotoGps>>;
      }> = [];
      photoNames.forEach((photoName, i) => {
        const gps = getPhotoGps(exifByName[photoNameKey(photoName)]);
        if (gps) withGps.push({ photoName, number: i + 1, gps });
      });

      // group photos taken from (nearly) the same spot so we can fan their
      // markers out side by side — otherwise they overlap and only the top one
      // is clickable
      const groups = new Map<string, typeof withGps>();
      withGps.forEach((entry) => {
        const key = `${entry.gps.lng.toFixed(6)},${entry.gps.lat.toFixed(6)}`;
        const group = groups.get(key) ?? [];
        group.push(entry);
        groups.set(key, group);
      });

      groups.forEach((group) => {
        group.forEach(({ photoName, number, gps }, posInGroup) => {
          const active =
            !!activePhoto &&
            photoNameKey(photoName) === photoNameKey(activePhoto);

          const element = createMarkerElement(
            number,
            gps.azimuth,
            gps.fov,
            active,
            () => onPhotoClick?.(photoName),
          );
          if (!element) return;

          // centre the fanned-out row on the shared spot (no offset when alone)
          const offsetX =
            group.length > 1
              ? (posInGroup - (group.length - 1) / 2) * SAME_SPOT_SPACING_PX
              : 0;

          const lngLat = [gps.lng, gps.lat] as LngLatLike;
          const marker = new maplibregl.Marker({
            element,
            anchor: 'center',
            offset: [offsetX, 0],
          })
            .setLngLat(lngLat)
            .addTo(map);
          addHoverPreview(element, photoName, lngLat);
          markersRef.current.push(marker);
        });
      });
    };

    // show markers only when zoomed in past the threshold, and keep that in
    // sync as the user zooms
    const syncVisibility = () => {
      const shouldShow = map.getZoom() > minZoom;
      const isShown = markersRef.current.length > 0;
      if (shouldShow && !isShown) buildMarkers();
      else if (!shouldShow && isShown) clearMarkers();
    };

    syncVisibility();
    map.on('zoomend', syncVisibility);

    return () => {
      map.off('zoomend', syncVisibility);
      clearMarkers();
    };
    // photoNamesKey stands in for the photoNames array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, photoExifs, photoNamesKey, activePhoto, onPhotoClick, minZoom]);
};
