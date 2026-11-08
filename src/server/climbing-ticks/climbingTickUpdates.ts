import type { Database } from 'better-sqlite3';
import { normalizePairingForDb } from '../../services/my-ticks/tickPairing';

const ALLOWED_FIELDS = [
  'osmType',
  'osmId',
  'timestamp',
  'style',
  'myGrade',
  'note',
  'pairing',
] as const;

/** Picks only user-editable columns from a request body (undefined = keep). */
export const getSafeTickUpdates = (
  body: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const entries = ALLOWED_FIELDS.map(
    (field) => [field, body?.[field]] as [string, unknown],
  );
  // careful - empty string or a zero are valid values!!
  const filtered = entries.filter(([, v]) => v !== undefined);
  const updates = Object.fromEntries(filtered);
  if (updates.pairing !== undefined) {
    updates.pairing = normalizePairingForDb(updates.pairing);
  }
  return updates;
};

export const updateTickRow = <T>(
  db: Database,
  tickId: number,
  updates: Record<string, unknown>,
): T | undefined => {
  const setClause = Object.keys(updates)
    .map((k) => `"${k}" = @${k}`)
    .join(', ');

  return db
    .prepare(
      `UPDATE climbing_ticks SET ${setClause} WHERE id = @tickId RETURNING *`,
    )
    .get({ ...updates, tickId }) as T | undefined;
};
