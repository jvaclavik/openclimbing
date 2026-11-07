export type RatingProfile = 'Simon' | 'Mama';
export type TourRating = {
  tour_id: string;
  profile: RatingProfile;
  stars: number | null;
  visited: boolean;
  visited_at: string | null;
  note: string;
};
export const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export const validateRating = (value: unknown): TourRating => {
  const body = value as TourRating;
  if (
    !body ||
    typeof body.tour_id !== 'string' ||
    !UUID.test(body.tour_id) ||
    !['Simon', 'Mama'].includes(body.profile) ||
    (body.stars !== null &&
      (!Number.isInteger(body.stars) || body.stars < 1 || body.stars > 5)) ||
    typeof body.visited !== 'boolean' ||
    typeof body.note !== 'string' ||
    body.note.length > 2000
  ) {
    throw new Error('Ungültige Bewertung.');
  }
  let date = body.visited_at;
  if (!body.visited) date = null;
  if (
    date !== null &&
    (typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date)
  )
    throw new Error('Ungültiges Begehungsdatum.');
  return {
    tour_id: body.tour_id,
    profile: body.profile,
    stars: body.stars,
    visited: body.visited,
    visited_at: date,
    note: body.note,
  };
};

export const ratingAverage = (ratings: TourRating[]) => {
  const values = ratings.flatMap(({ stars }) =>
    stars === null ? [] : [stars],
  );
  return values.length
    ? values.reduce((sum, stars) => sum + stars, 0) / values.length
    : null;
};
