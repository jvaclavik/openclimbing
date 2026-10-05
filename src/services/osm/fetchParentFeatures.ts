import { Feature, OsmId } from '../types';
import { fetchJson } from '../fetch';
import { getOsmParentUrl } from './urls';
import { addSchemaToFeature } from '../tagging/idTaggingScheme';
import { osmToFeature } from './osmToFeature';
import { OsmResponse } from './types';

const getOsmParentPromise = async (apiId: OsmId) =>
  fetchJson<OsmResponse>(getOsmParentUrl(apiId));

export const fetchParentFeatures = async (apiId: OsmId): Promise<Feature[]> => {
  if (apiId.id < 0) {
    return [];
  }

  const { elements } = await getOsmParentPromise(apiId);
  return elements.map((element) => addSchemaToFeature(osmToFeature(element)));
};

const isAreaOrCrag = (feature: Feature) =>
  feature.tags?.climbing === 'area' || feature.tags?.climbing === 'crag';

// Direct parents plus area/crag ancestors, nearest first. Editing still uses
// fetchParentFeatures() so it only sees relations that actually contain the feature.
export const fetchAncestorFeatures = async (
  apiId: OsmId,
): Promise<Feature[]> => {
  const result: Feature[] = [];
  const seen = new Set<string>();
  let frontier: OsmId[] = [apiId];

  for (let depth = 0; depth < 12 && frontier.length; depth++) {
    const batches = await Promise.all(
      frontier.map((id) => fetchParentFeatures(id)),
    );
    const next: OsmId[] = [];

    for (const parents of batches) {
      for (const parent of parents) {
        const key = `${parent.osmMeta.type}/${parent.osmMeta.id}`;
        if (seen.has(key)) continue;
        if (
          parent.osmMeta.type === apiId.type &&
          parent.osmMeta.id === apiId.id
        ) {
          continue;
        }
        seen.add(key);
        result.push(parent);
        if (isAreaOrCrag(parent)) next.push(parent.osmMeta);
      }
    }

    frontier = next;
  }

  return result;
};
