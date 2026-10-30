import { getApiId } from '../../helpers';
import {
  DiffDocXmljs,
  NodeItemXml,
  RelationItemXml,
  WayItemXml,
} from './xmlTypes';
import { xmljsBuildOsmChange } from './xmlHelpers';
import { DataItem } from '../../../components/FeaturePanel/EditDialog/context/types';

const isNode = ({ shortId }: DataItem) => shortId.startsWith('n');
const isWay = ({ shortId }: DataItem) => shortId.startsWith('w');
const isRelation = ({ shortId }: DataItem) => shortId.startsWith('r');

const TAG = ([k, v]: [string, string]) => k && v;

type Changeset = {} | { changeset: string };

const nodeItemToXml = (change: DataItem, changeset: Changeset): NodeItemXml => {
  const { shortId, version = 0, tagsEntries, nodeLonLat } = change;
  const { id } = getApiId(shortId);
  const [lon, lat] = nodeLonLat;

  return {
    $: { id, lon, lat, version, ...changeset },
    tag: tagsEntries.filter(TAG).map(([k, v]) => ({ $: { k, v } })),
  };
};

const wayItemToXml = (change: DataItem, changeset: Changeset): WayItemXml => {
  const { shortId, version = 0, tagsEntries, nodes } = change;
  const { id } = getApiId(shortId);

  if (!nodes) {
    throw new Error(`No nodes found for item: way/${id}`);
  }

  return {
    $: { id, version, ...changeset },
    tag: tagsEntries.filter(TAG).map(([k, v]) => ({ $: { k, v } })),
    nd: nodes.map((ref) => ({ $: { ref } })),
  };
};

const relationItemToXml = (
  change: DataItem,
  changeset: Changeset,
): RelationItemXml => {
  const { shortId, version = 0, tagsEntries, members } = change;
  const { id } = getApiId(shortId);

  return {
    $: { id, version, ...changeset },
    tag: tagsEntries.filter(TAG).map(([k, v]) => ({ $: { k, v } })),
    member: members.map(({ shortId, role }) => {
      const { type, id } = getApiId(shortId);
      return { $: { type, ref: id, role } };
    }),
  };
};

const isNew = ({ shortId }: DataItem) => shortId.includes('-');
const isDeleted = ({ toBeDeleted }: DataItem) => toBeDeleted;
const condition = {
  _ignore_: (item: DataItem) => isNew(item) && isDeleted(item),
  create: (item: DataItem) => isNew(item) && !isDeleted(item),
  delete: (item: DataItem) => !isNew(item) && isDeleted(item),
  modify: (item: DataItem) => !isNew(item) && !isDeleted(item),
};

// OSM resolves a placeholder (negative) id only when that element was created
// earlier in the same osmChange, so member relations must precede their parents
// (e.g. a new area added after its new crag in the edit dialog).
const membersFirst = (relations: DataItem[]) => {
  const byId = new Map(
    relations.map((relation) => [relation.shortId, relation]),
  );
  const sorted: DataItem[] = [];
  const visited = new Set<string>();
  const visit = (relation: DataItem) => {
    if (visited.has(relation.shortId)) return;
    visited.add(relation.shortId);
    relation.members?.forEach(({ shortId }) => {
      const member = byId.get(shortId);
      if (member) visit(member);
    });
    sorted.push(relation);
  };
  relations.forEach(visit);
  return sorted;
};

const getXmlByAction = (
  changes: DataItem[],
  action: 'create' | 'modify' | 'delete',
  changeset: Changeset,
) => {
  const items = changes.filter(condition[action]);
  const relations = items.filter(isRelation).toReversed(); // usually a new relation is referenced only by one added before it
  return {
    node: items.filter(isNode).map((node) => nodeItemToXml(node, changeset)),
    way: items.filter(isWay).map((way) => wayItemToXml(way, changeset)),
    relation: (action === 'create' ? membersFirst(relations) : relations).map(
      (relation) => relationItemToXml(relation, changeset),
    ),
  };
};

export const getDiffXml = (
  changes: DataItem[],
  changesetId?: string,
): string => {
  const changeset = changesetId ? { changeset: changesetId } : {};

  const xml: DiffDocXmljs = {
    $: { generator: 'OpenClimbing', version: '0.6' },
    create: getXmlByAction(changes, 'create', changeset),
    modify: getXmlByAction(changes, 'modify', changeset),
    delete: {
      $: { 'if-unused': 'true' },
      ...getXmlByAction(changes, 'delete', changeset),
    },
  };

  return xmljsBuildOsmChange(xml);
};
