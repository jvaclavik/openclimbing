import { z } from 'zod';
import { databaseSettings } from '../tours/database';

export const chatMessages = z
  .array(
    z
      .object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(2000),
      })
      .strict(),
  )
  .min(1)
  .max(12)
  .refine(
    (messages) =>
      messages.every(
        (message, index) => message.role === (index % 2 ? 'assistant' : 'user'),
      ) && messages.at(-1).role === 'user',
  );

export type ChatTour = {
  name: string;
  href: string;
  difficulty: string | null;
  location: string;
  source: string;
  durationMinutes?: number;
  lengthM?: number;
};
const area = z.object({
  osmType: z.enum(['node', 'way', 'relation']),
  osmId: z.number().int().positive(),
  name: z.string().nullable(),
  countryCode: z.string().nullable(),
  city: z.string().nullish(),
  viaFerrataScale: z.string().nullish(),
});
const stored = z.object({
  name: z.string(),
  osm_ref: z.string().nullable(),
  difficulty: z.string().nullable(),
  duration_minutes: z.number().nullable(),
  length_m: z.number(),
  source: z.string(),
  attribution: z.string(),
});

export async function loadChatCatalog() {
  const warnings: string[] = [];
  const tours: ChatTour[] = [];
  try {
    // Same public OSM catalog used by the map on Vercel. No user-supplied URL.
    const response = await fetch(
      'https://openclimbing.org/api/climbing-tiles/areas?type=ferrata',
      {
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      },
    );
    if (!response.ok) throw new Error('catalog');
    const rows = z
      .array(area)
      .max(20000)
      .parse(await response.json());
    for (const row of rows) {
      if (!row.name) continue;
      tours.push({
        name: row.name.slice(0, 160),
        href: `/${row.osmType}/${row.osmId}`,
        difficulty: row.viaFerrataScale?.slice(0, 40) || null,
        location: [row.city, row.countryCode].filter(Boolean).join(', '),
        source: 'OpenStreetMap (ODbL)',
      });
    }
  } catch {
    warnings.push(
      'Der öffentliche Klettersteig-Katalog ist derzeit nicht erreichbar.',
    );
  }
  const { database } = databaseSettings();
  if (database) {
    try {
      const url = database.endpoint;
      // Deliberately exclude tracks, ratings, family profiles and private notes.
      url.searchParams.set(
        'select',
        'name,osm_ref,difficulty,duration_minutes,length_m,source,attribution',
      );
      url.searchParams.set('order', 'id.asc');
      url.searchParams.set('limit', '201');
      const response = await fetch(url, {
        headers: { apikey: database.key },
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('catalog');
      const rows = z.array(stored).parse(await response.json());
      if (rows.length > 200)
        warnings.push(
          'Es werden nur die ersten 200 gespeicherten Touren durchsucht.',
        );
      for (const row of rows.slice(0, 200)) {
        if (
          !row.osm_ref ||
          !/^(node|way|relation)\/[1-9]\d*$/.test(row.osm_ref)
        )
          continue;
        const tour: ChatTour = {
          name: row.name.slice(0, 160),
          href: '/' + row.osm_ref,
          difficulty: row.difficulty,
          durationMinutes: row.duration_minutes,
          lengthM: row.length_m,
          location: '',
          source: [row.source, row.attribution].join(' · ').slice(0, 500),
        };
        const previous = tours.findIndex((item) => item.href === tour.href);
        if (previous >= 0)
          tours[previous] = {
            ...tours[previous],
            ...tour,
            location: tours[previous].location,
          };
        else tours.push(tour);
      }
    } catch {
      warnings.push('Die gespeicherten Touren sind derzeit nicht erreichbar.');
    }
  } else {
    warnings.push(
      'Gespeicherte Touren sind in dieser Vorschau nicht angebunden; die Suche nutzt OpenStreetMap.',
    );
  }
  return { tours, warnings };
}

const normalize = (text: string) =>
  text
    .toLocaleLowerCase('de')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss');
const gradeLetters = (value: string) =>
  value.toUpperCase().match(/[A-F]/g) ?? [];

export function searchChatTours(
  tours: ChatTour[],
  query: string,
  countryCode: string,
  grade = '',
) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const wanted = gradeLetters(grade);
  return tours
    .filter((tour) => {
      const haystack = normalize(tour.name + ' ' + tour.location);
      const letters = gradeLetters(tour.difficulty ?? '');
      return (
        (!countryCode ||
          tour.location.toLowerCase().endsWith(countryCode.toLowerCase())) &&
        words.every((word) => haystack.includes(word)) &&
        (wanted.length === 0 ||
          letters.some((letter) => wanted.includes(letter)))
      );
    })
    .slice(0, 8);
}
