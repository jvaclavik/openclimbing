/** In-app climbing profile URL (OSM display name). */
export const profilePathForOsmDisplayName = (displayName: string): string =>
  `/u/${encodeURIComponent(displayName)}`;
