import { useMemo } from 'react';
import { useFeatureContext } from '../utils/FeatureContext';
import { getGlobalMap } from '../../services/mapStorage';
import { useGetPhotoExifs } from '../FeaturePanel/Climbing/utils/usePhotoExifGps';
import { usePhotoMarkers } from '../FeaturePanel/Climbing/utils/usePhotoMarkers';
import { usePhotoHighlightContext } from '../FeaturePanel/Climbing/contexts/PhotoHighlightContext';
import { removeFilePrefix } from '../FeaturePanel/Climbing/utils/photo';
import { Feature, isTag } from '../../services/types';

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

  return null;
};
