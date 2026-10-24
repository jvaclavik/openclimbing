import { FeatureTags } from '../../../../../../services/types';
import { EditDataItem, Member } from '../../../context/types';
import { findInItems } from '../../../context/utils';
import {
  canHaveStartPhoto,
  hasStartPhoto,
} from '../../../../Climbing/utils/photo';

export type CragRoute = { shortId: string; tags: FeatureTags };

// The crag's routes in their order – with the tags edited in this session (eg.
// a start photo uploaded a minute ago), or as they were loaded with the crag.
export const getCragRoutes = (
  members: Member[] | undefined,
  items: EditDataItem[],
): CragRoute[] =>
  (members ?? [])
    .map(({ shortId, originalTags }) => ({
      shortId,
      tags: findInItems(items, shortId)?.tags ?? originalTags ?? {},
    }))
    .filter(({ tags }) => canHaveStartPhoto(tags));

export const countStartPhotos = (routes: CragRoute[]) =>
  routes.filter(({ tags }) => hasStartPhoto(tags)).length;

// Walks along the crag: the routes after `afterShortId` first, then the ones
// skipped at the beginning.
export const getNextRouteWithoutStartPhoto = (
  routes: CragRoute[],
  afterShortId?: string,
): CragRoute | undefined => {
  const index = routes.findIndex(({ shortId }) => shortId === afterShortId);
  const ordered = [...routes.slice(index + 1), ...routes.slice(0, index + 1)];
  return ordered.find(
    ({ shortId, tags }) => shortId !== afterShortId && !hasStartPhoto(tags),
  );
};

export const findParentCrag = (items: EditDataItem[], shortId: string) =>
  items.find(
    ({ tags, members }) =>
      tags.climbing === 'crag' &&
      members?.some((member) => member.shortId === shortId),
  );
