import { useEffect, useMemo, useRef } from 'react';
import { useFeatureContext } from '../utils/FeatureContext';
import { getGlobalMap } from '../../services/mapStorage';
import { useGetPhotoExifs } from '../FeaturePanel/Climbing/utils/usePhotoExifGps';
import { usePhotoMarkers } from '../FeaturePanel/Climbing/utils/usePhotoMarkers';
import { usePhotoHighlightContext } from '../FeaturePanel/Climbing/contexts/PhotoHighlightContext';
import {
  isRouteDrawnOnPhoto,
  removeFilePrefix,
} from '../FeaturePanel/Climbing/utils/photo';
import { convertOsmIdToMapId } from '../../services/fetchCrags';
import { Feature, isTag } from '../../services/types';

// The legacy overlay source ('climbing', from fetchCrags) and the climbing
// tiles source ('climbing-tiles', used in production) both id their features
// with convertOsmIdToMapId, so the same feature-state works for either.
const CLIMBING_SOURCES = ['climbing', 'climbing-tiles'];

/**
 * Emphasizes (via `feature-state: highlighted`) the climbing route dots on the
 * main map whose line is drawn on the currently highlighted photo, so clicking
 * a photo lights up the routes it shows. Mirrors the bolding CragMap does.
 */
const useHighlightDrawnRoutesOnMap = (
  feature: Feature,
  highlightedPhoto: string | null,
) => {
  const prevIdsRef = useRef<number[]>([]);

  useEffect(() => {
    const map = getGlobalMap();
    if (!map) return undefined;
    const sources = CLIMBING_SOURCES.filter((source) => map.getSource(source));
    if (!sources.length) return undefined;

    const setHighlighted = (id: number, highlighted: boolean) => {
      sources.forEach((source) => {
        map.setFeatureState({ source, id }, { highlighted });
      });
    };

    const clear = () => {
      prevIdsRef.current.forEach((id) => setHighlighted(id, false));
      prevIdsRef.current = [];
    };

    clear();

    const ids = (feature?.memberFeatures ?? [])
      .filter((route) => isRouteDrawnOnPhoto(route.tags, highlightedPhoto))
      .map((route) => convertOsmIdToMapId(route.osmMeta));

    ids.forEach((id) => setHighlighted(id, true));
    prevIdsRef.current = ids;

    return clear;
  }, [feature, highlightedPhoto]);
};

// Wikimedia Commons photo names of a crag, in the SAME order the feature panel
// image strip shows them, so marker numbers line up with the strip. We read
// from `feature.imageDefs` because it already contains the crag's own photos
// plus its route members' photos (added by mergeMemberImageDefs) in strip
// order, deduplicated.
const getCragPhotoNames = (feature: Feature): string[] =>
  (feature.imageDefs ?? [])
    .filter(isTag)
    .filter((def) => def.v?.startsWith('File:'))
    .map((def) => removeFilePrefix(def.v));

/**
 * Renders camera markers on the main map at the GPS position each crag photo
 * was taken from, while a climbing crag is open in the feature panel. Clicking
 * a marker scrolls to and highlights that photo in the panel's image strip.
 */
export const CragPhotoMarkers = () => {
  const { feature } = useFeatureContext();
  const { highlightedPhoto, togglePhoto } = usePhotoHighlightContext();

  const isCrag = feature?.tags?.climbing === 'crag';

  const photoNames = useMemo(
    () => (isCrag && feature ? getCragPhotoNames(feature) : []),
    [isCrag, feature],
  );

  const photoExifs = useGetPhotoExifs(photoNames);

  usePhotoMarkers(isCrag ? getGlobalMap() : null, photoExifs, photoNames, {
    activePhoto: highlightedPhoto,
    onPhotoClick: togglePhoto,
  });

  useHighlightDrawnRoutesOnMap(feature, highlightedPhoto);

  return null;
};
