import { Feature } from '../../types';
import { sanitizeForCommons } from './filename';

const getParentName = (route: Feature, climbing: 'crag' | 'area') =>
  route.parentFeatures?.find(
    (parent) => parent.tags?.climbing === climbing && parent.tags?.name,
  )?.tags.name;

// Start photos of neighbouring routes look alike, so the route name and its
// crag go to the filename – eg. "Area - Crag - Route - start".
export const getStartPhotoFilenameStem = (route: Feature): string => {
  const parts = [
    getParentName(route, 'area'),
    getParentName(route, 'crag'),
    route.tags?.name || 'Climbing route',
  ].filter(Boolean);
  return sanitizeForCommons(`${parts.join(' - ')} - start`);
};

export const getStartPhotoDescription = (route: Feature): string => {
  const name = route.tags?.name;
  const crag = getParentName(route, 'crag');
  const routeLabel = name ? `climbing route ${name}` : 'a climbing route';
  return `Start of ${routeLabel}${crag ? ` at ${crag}` : ''}`;
};
