// OSM climbing:length is metres when stored as a bare number; otherwise the
// value already includes a unit (e.g. "100'").
export const formatClimbingLength = (raw?: string): string | null => {
  const length = raw?.trim();
  if (!length) {
    return null;
  }
  return /^\d+([.,]\d+)?$/.test(length) ? `${length} m` : length;
};

export const formatRouteLengthAndAuthor = (tags: {
  author?: string;
  'climbing:length'?: string;
}): string | null => {
  const parts = [
    formatClimbingLength(tags['climbing:length']),
    tags.author?.trim() || null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
};
