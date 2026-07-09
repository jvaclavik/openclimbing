import { OsmId } from '../types';
import { getShortId } from '../helpers';

/**
 * Features the user has edited in THIS browser session (via saveChanges()).
 *
 * For these we must NOT serve the climbing-tiles SQLite DB (which only refreshes
 * nightly) - it would show the pre-edit state. fetchFeatureFromTiles() checks
 * this registry and always fetches fresh data from OSM instead, so right after
 * an edit the FeaturePanel shows the updated feature.
 *
 * It's an in-memory Set (browser only) that survives client-side router
 * navigations (the post-save `Router.replace(redirect)`), and is naturally
 * dropped on a full page reload.
 */
const recentlyEdited = new Set<string>();

export const markFeatureAsRecentlyEdited = (apiId: OsmId) => {
  recentlyEdited.add(getShortId(apiId));
};

export const wasRecentlyEdited = (apiId: OsmId): boolean =>
  recentlyEdited.has(getShortId(apiId));
