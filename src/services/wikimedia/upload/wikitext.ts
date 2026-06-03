import { Feature, LonLat } from '../../types';
import { getFullOsmappLink } from '../../helpers';
import { WikimediaCommonsUser } from '../auth/session';
import { isClimbingCrag } from '../../../utils';

const formatCommonsDate = (date: Date | null): string => {
  if (!date) return '';
  // Commons accepts ISO date with or without time. Strip milliseconds.
  return date.toISOString().replace(/\.\d+Z$/, 'Z');
};

const formatLocation = (location: LonLat | null, template: string): string => {
  if (!location) return '';
  const [lon, lat] = location;
  return `{{${template}|${lat.toFixed(6)}|${lon.toFixed(6)}}}`;
};

const escapeWikitext = (raw: string) => raw.replace(/[|=]/g, ' ');

export type LicenseId =
  | 'cc-by-sa-4.0'
  | 'cc-by-4.0'
  | 'cc-by-sa-3.0'
  | 'cc-by-3.0'
  | 'cc-zero';

export const LICENSE_OPTIONS: { id: LicenseId; label: string }[] = [
  { id: 'cc-by-sa-4.0', label: 'CC BY-SA 4.0' },
  { id: 'cc-by-4.0', label: 'CC BY 4.0' },
  { id: 'cc-by-sa-3.0', label: 'CC BY-SA 3.0' },
  { id: 'cc-by-3.0', label: 'CC BY 3.0' },
  { id: 'cc-zero', label: 'CC0 (Public Domain)' },
];

export const DEFAULT_LICENSE: LicenseId = 'cc-by-sa-4.0';

type BuildArgs = {
  feature: Feature;
  user: WikimediaCommonsUser;
  description: string;
  categories: string[];
  license: LicenseId;
  date: Date | null;
  photoLocation: LonLat | null;
};

export const getDefaultDescription = (feature: Feature): string => {
  if (isClimbingCrag(feature)) {
    return 'Climbing rock';
  }
  return '';
};

export const buildUploadWikitext = ({
  feature,
  user,
  description,
  categories,
  license,
  date,
  photoLocation,
}: BuildArgs): string => {
  const placeLocation = feature.center
    ? ([feature.center[0], feature.center[1]] as LonLat)
    : null;

  const dateText = formatCommonsDate(date ?? new Date());
  const descriptionText = escapeWikitext(description || '').trim();
  const sourceLink = getFullOsmappLink(feature);
  const author = `[https://commons.wikimedia.org/wiki/User:${encodeURIComponent(
    user.username,
  )} ${user.username}]`;

  const locationLine = formatLocation(photoLocation, 'Location');
  const objectLocationLine = formatLocation(placeLocation, 'Object location');

  const categoryLines = categories
    .map((c) => (c || '').replace(/^Category:/, '').trim())
    .filter(Boolean)
    .map((name) => `[[Category:${name}]]`);

  const licenseLine =
    license === 'cc-zero'
      ? `{{Self|cc-zero|author=${author}}}`
      : `{{Self|${license}|author=${author}}}`;

  const lines = [
    '=={{int:filedesc}}==',
    '{{Information',
    `  |description  = {{en|1=${descriptionText}}}`,
    `  |date         = ${dateText}`,
    '  |source       = {{Own photo}}',
    `  |author       = OpenStreetMap user ${author}`,
    `  |other_fields = {{Information field |name= OpenClimbing |value= ${sourceLink} }}`,
    '}}',
    locationLine,
    objectLocationLine,
    '',
    '=={{int:license-header}}==',
    licenseLine,
    '',
    ...categoryLines,
  ];

  return lines.filter(Boolean).join('\n');
};
