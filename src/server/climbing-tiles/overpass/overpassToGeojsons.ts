import { FeatureGeometry, OsmId, Point } from '../../../services/types';
import { getCenter } from '../../../services/getCenter';
import { getHistogram, sumMemberHistograms } from './histogram';
import {
  GeojsonFeature,
  Lookup,
  OsmItem,
  OsmNode,
  OsmRelation,
  OsmResponse,
  OsmWay,
} from './types';
import { getUrlOsmId } from '../../../services/helpers';
import {
  ClimbingAttributes,
  getClimbingAttributes,
  mergeClimbingAttributes,
} from '../../../services/tagging/climbing/climbingAttributes';

const convertOsmIdToMapId = (apiId: OsmId) => {
  const osmToMapType = { node: 0, way: 1, relation: 4 };
  return parseInt(`${apiId.id}${osmToMapType[apiId.type]}`, 10);
};

const getItems = (elements: OsmItem[], log: (message: string) => void) => {
  const nodes: OsmNode[] = [];
  const ways: OsmWay[] = [];
  const relations: OsmRelation[] = [];
  for (const element of elements) {
    if (element.type === 'node') {
      nodes.push(element);
    } else if (element.type === 'way') {
      ways.push(element);
    } else if (element.type === 'relation') {
      if (element.members) {
        relations.push(element);
      } else {
        log(`Skipping relation without members: relation/${element.id}`);
      }
    }
  }
  return { nodes, ways, relations };
};

const safeParseFloat = (value: string | undefined): number => {
  const num = parseFloat(value ?? '0');
  return Number.isNaN(num) ? 0 : num;
};

const getRouteNumberFromTags = ({ tags }: OsmItem) => {
  const sum =
    safeParseFloat(tags['climbing:sport']) +
    safeParseFloat(tags['climbing:trad']) +
    safeParseFloat(tags['climbing:ice']) +
    safeParseFloat(tags['climbing:multipitch']);

  return sum > 0 ? sum : 1; // default 1 for crag with unknown count (needed for proper z-index in map)
};

const isRoute = (member: GeojsonFeature) =>
  ['route', 'route_bottom'].includes(member.tags.climbing);

// A route is "drawn on a photo" when it has a non-empty `wikimedia_commons[...]:path` tag.
const isWikimediaCommonsPhotoPath = (tag: string) =>
  /^wikimedia_commons(:\d+)*:path$/.test(tag);

const hasPathOnPhoto = (member: GeojsonFeature) =>
  Object.keys(member.tags ?? {}).some(
    (key) =>
      isWikimediaCommonsPhotoPath(key) && Boolean(member.tags[key]?.trim()),
  );

const countRoutesWithPhoto = (members: GeojsonFeature[]) =>
  members.reduce((acc, member) => {
    if (isRoute(member)) {
      return acc + (hasPathOnPhoto(member) ? 1 : 0);
    }
    // crag / sub-area: use its own precomputed recursive count
    return acc + (member.properties.routesWithPhoto ?? 0);
  }, 0);

const hasOwnImages = (element: OsmItem) =>
  Object.keys(element.tags ?? {}).some((key) =>
    key.startsWith('wikimedia_commons'),
  );

const hasMemberImages = (member: GeojsonFeature) =>
  member?.properties.hasImages;

const getCommonFields = (
  element: OsmItem,
  geometry: FeatureGeometry,
): GeojsonFeature => {
  const { type, id, tags = {} } = element;
  const center = getCenter(geometry) ?? undefined;

  return {
    type: 'Feature',
    id: convertOsmIdToMapId({ type, id }),
    osmMeta: { type, id },
    tags,
    geometry,
    center,
    members: element.type === 'relation' ? element.members : undefined,
    properties: {},
  };
};

const getMemberAttributes = (members: GeojsonFeature[]): ClimbingAttributes[] =>
  members.map(
    (member) => member.properties.attributes ?? getClimbingAttributes({}),
  );

const getNodeWayProperties = (element: OsmNode | OsmWay) => {
  const { tags = {} } = element;
  const attributes = getClimbingAttributes(tags);

  if (
    tags.climbing === 'crag' ||
    tags.climbing === 'area' ||
    tags.natural === 'cliff' ||
    tags.natural === 'peak'
  ) {
    return {
      hasImages: hasOwnImages(element),
      routeCount: getRouteNumberFromTags(element),
      attributes,
    };
  }

  return {
    hasImages: hasOwnImages(element),
    attributes,
  };
};

const convertNode = (node: OsmNode): GeojsonFeature => {
  const geometry: Point = {
    type: 'Point',
    coordinates: [node.lon, node.lat],
  };

  return {
    ...getCommonFields(node, geometry),
    properties: getNodeWayProperties(node),
  };
};

const convertWay = (way: OsmWay, lookup: Lookup): GeojsonFeature => {
  const geometry = {
    type: 'LineString' as const,
    coordinates: way.nodes
      .map((ref) => lookup.node[ref]?.geometry?.coordinates)
      .filter(Boolean),
  };

  return {
    ...getCommonFields(way, geometry),
    properties: getNodeWayProperties(way),
  };
};

const getRelationProperties = (
  relation: OsmRelation,
  members: GeojsonFeature[],
) => {
  const { tags = {} } = relation;

  if (tags.climbing === 'crag') {
    return {
      hasImages: hasOwnImages(relation) || members.some(hasMemberImages),
      histogram: getHistogram(members),
      routeCount: Math.max(
        members.filter(isRoute).length,
        getRouteNumberFromTags(relation),
      ),
      routesWithPhoto: countRoutesWithPhoto(members),
      attributes: mergeClimbingAttributes([
        getClimbingAttributes(tags),
        ...getMemberAttributes(members),
      ]),
    };
  }

  if (tags.climbing === 'area') {
    return {
      hasImages: hasOwnImages(relation) || members.some(hasMemberImages),
      histogram: sumMemberHistograms(members),
      routeCount: members
        .map((member) => member?.properties.routeCount ?? 1)
        .reduce((acc, count) => acc + count, 0),
      routesWithPhoto: countRoutesWithPhoto(members),
      attributes: mergeClimbingAttributes([
        getClimbingAttributes(tags),
        ...getMemberAttributes(members),
      ]),
    };
  }

  return {};
};

const lookupRelationMembers = (element: OsmItem, lookup: Lookup) =>
  element.type === 'relation'
    ? element.members.map(({ type, ref }) => lookup[type][ref]).filter(Boolean) // some members may be undefined in first pass
    : [];

const convertRelation = (
  relation: OsmRelation,
  lookup: Lookup,
): GeojsonFeature => {
  const members = lookupRelationMembers(relation, lookup); // TODO lookup-members + common-fields are repeated in each pass (unneccesary)
  const geometry = members.length
    ? {
        type: 'GeometryCollection' as const,
        geometries: members.map(({ geometry }) => geometry),
      }
    : undefined;

  return {
    ...getCommonFields(relation, geometry),
    properties: getRelationProperties(relation, members),
  };
};

const addToLookup = <T extends FeatureGeometry>(
  lookup: Lookup,
  items: GeojsonFeature<T>[],
) => {
  items.forEach((item) => {
    // @ts-ignore
    lookup[item.osmMeta.type][item.osmMeta.id] = item; // eslint-disable-line no-param-reassign
  });
};

// relationId -> ids of area/crag relations that list it as a (direct) member
const getRelationParentsMap = (lookup: Lookup) => {
  const parentsOf = new Map<number, number[]>();
  for (const relation of Object.values(lookup.relation)) {
    if (!['area', 'crag'].includes(relation.tags?.climbing)) continue;
    for (const member of relation.members ?? []) {
      if (member.type !== 'relation') continue;
      const parents = parentsOf.get(member.ref) ?? [];
      parents.push(relation.osmMeta.id);
      parentsOf.set(member.ref, parents);
    }
  }
  return parentsOf;
};

// is `candidateId` reachable by walking up from `ofId` through relation nesting?
const isAncestor = (
  parentsOf: Map<number, number[]>,
  candidateId: number,
  ofId: number,
) => {
  const seen = new Set<number>([ofId]);
  const queue = [...(parentsOf.get(ofId) ?? [])];
  while (queue.length) {
    const current = queue.shift();
    if (current === candidateId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    queue.push(...(parentsOf.get(current) ?? []));
  }
  return false;
};

const getAncestorChainLength = (
  parentsOf: Map<number, number[]>,
  id: number,
) => {
  let length = 0;
  let current = id;
  const seen = new Set([id]);
  for (;;) {
    const next = parentsOf.get(current)?.[0];
    if (next === undefined || seen.has(next)) return length;
    seen.add(next);
    current = next;
    length++;
  }
};

const addParentIds = (lookup: Lookup, log: (message: string) => void) => {
  const parentsOf = getRelationParentsMap(lookup);

  for (const relation of Object.values(lookup.relation)) {
    if (!['area', 'crag'].includes(relation.tags?.climbing)) continue;

    for (const member of relation.members ?? []) {
      const child = lookup[member.type][member.ref]; // we know, that in lookup is the same object as in nodesOut/waysOut
      if (!child) continue;

      const existingParentId = child.properties.parentId;
      const newParentId = relation.osmMeta.id;

      // same relation listed twice as a member - not a real conflict
      if (existingParentId === undefined || existingParentId === newParentId) {
        child.properties.parentId = newParentId;
        continue;
      }

      // one candidate parent is nested inside the other - transitively correct,
      // just keep the nearer (more specific) one
      if (isAncestor(parentsOf, newParentId, existingParentId)) {
        continue;
      }
      if (isAncestor(parentsOf, existingParentId, newParentId)) {
        child.properties.parentId = newParentId;
        continue;
      }

      // two independent candidate parents - prefer the more deeply nested one
      // (more specific location) when the two chains differ in depth
      const existingDepth = getAncestorChainLength(parentsOf, existingParentId);
      const newDepth = getAncestorChainLength(parentsOf, newParentId);

      if (existingDepth === newDepth) {
        log(
          `Child ${getUrlOsmId(child.osmMeta)} has more parents: ${existingParentId} and ${newParentId}`,
        );
        child.properties.parentId = newParentId;
        continue;
      }

      const [deeperId, shallowerId] =
        existingDepth > newDepth
          ? [existingParentId, newParentId]
          : [newParentId, existingParentId];

      log(
        `Child ${getUrlOsmId(child.osmMeta)} has more parents: ${existingParentId} and ${newParentId}, kept deeper parent ${deeperId} over ${shallowerId}`,
      );
      child.properties.parentId = deeperId;
    }
  }
};

export const overpassToGeojsons = (
  response: OsmResponse,
  log: (message: string) => void,
) => {
  const lookup = { node: {}, way: {}, relation: {} } as Lookup;
  const { nodes, ways, relations } = getItems(response.elements, log);

  addToLookup(lookup, nodes.map(convertNode));

  addToLookup(
    lookup,
    ways.map((way) => convertWay(way, lookup)),
  );

  for (let i = 0; i < 3; i++) {
    addToLookup(
      lookup,
      relations.map((relation) => convertRelation(relation, lookup)),
    );
  }

  addParentIds(lookup, log);

  return {
    node: Object.values(lookup.node),
    way: Object.values(lookup.way),
    relation: Object.values(lookup.relation),
  };
};
