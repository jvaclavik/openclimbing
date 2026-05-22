import { OsmElement } from './types';
import { Feature } from '../types';
import { addSchemaToFeature } from '../tagging/idTaggingScheme';
import { osmToFeature } from './osmToFeature';

export type ItemsMap = {
  node: Record<number, OsmElement<'node'>>;
  way: Record<number, OsmElement<'way'>>;
  relation: Record<number, OsmElement<'relation'>>;
};

export const getItemsMap = (elements: OsmElement[]) => {
  const itemsMap: ItemsMap = { node: {}, way: {}, relation: {} };
  elements.forEach((element) => {
    itemsMap[element.type][element.id] = element;
  });
  return itemsMap;
};

export const getMemberFeatures = (
  members: Feature['members'],
  itemsMap: ReturnType<typeof getItemsMap>,
) =>
  (members ?? [])
    .map(({ type, ref, role }) => {
      const element = itemsMap[type][ref];
      if (!element) {
        return null;
      }

      const feature = addSchemaToFeature(osmToFeature(element));
      feature.osmMeta.role = role;

      // Overpass `out center` adds an `element.center` to ways/relations.
      // osmToFeature() doesn't read it (only handles node lat/lon), so set it
      // here for member features – otherwise crags inside a climbing area have
      // no `feature.center` and any UI relying on it (maps, GPS links, ...)
      // can't position them.
      if (!feature.center && element.center) {
        feature.center = [element.center.lon, element.center.lat];
      }

      return feature;
    })
    .filter(Boolean);
