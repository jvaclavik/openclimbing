import { QUARTER_PEEK_PX } from '../utils/drawerSnap';

export const TOUR_HELP_LABEL = 'Tourenhilfe';
export const TOUR_HELP_Z = 1090;

export const STARTERS = [
  'Leichte Touren hier finden',
  'Welche Tour passt zu meiner Erfahrung?',
  'Welche Klettersteige gibt es in einer Region?',
] as const;

export const HERE_STARTER = STARTERS[0];

export const INTRO = 'Frag nach Region, Erfahrung oder Schwierigkeit.';

export const LIMITATION =
  'Keine Live-Daten zu Wetter oder Sperrungen. Die Kartenansicht wird nicht als Standort gelesen.';

export const DATA_NOTICE =
  'KI-Vorschau mit OpenAI über Vercel AI Gateway. Deine Nachrichten und passende Touren-Metadaten werden zur Beantwortung übertragen. Bitte keine persönlichen Daten eingeben. Familiennotizen und Bewertungen werden nicht übertragen. KI kann Fehler machen; vor Ort und mit verlässlichen Quellen prüfen. Verlauf nur in diesem Fenster; die letzten fünf Frage-Antwort-Paare werden mitgesendet.';

const MESSAGE_LIMIT = 2000;
const CONTROL_CLEARANCE = 88;

export type TourHelpSnap = 'quarter' | 'half' | 'full' | null;

export type TourHelpAnchor = {
  top?: number;
  bottom: number | string;
  width: string;
  maxHeight: string;
};

type NamedFeature = {
  skeleton?: boolean;
  tags?: Record<string, string | undefined>;
};

const shortTag = (value: string | undefined, max: number) => {
  const text = value?.replace(/\s+/g, ' ').trim();
  if (!text || text.length > max) return undefined;
  return text;
};

/** Name of the open map feature. Coordinates are not a place name. */
export const selectedTourLabel = (feature: NamedFeature | null | undefined) => {
  if (!feature || feature.skeleton) return null;
  const name = shortTag(feature.tags?.name, 120);
  if (!name) return null;
  const where = [
    feature.tags?.['addr:city'],
    feature.tags?.locality,
    feature.tags?.['addr:suburb'],
  ]
    .map((part) => shortTag(part, 80))
    .find(Boolean);
  return where ? `${name}, ${where}` : name;
};

export const messageForSend = (
  question: string,
  feature: NamedFeature | null | undefined,
) => {
  if (question !== HERE_STARTER) return question;
  const label = selectedTourLabel(feature);
  if (!label) return question;
  const prefix = '\nAusgewählte Karte: ';
  const room = MESSAGE_LIMIT - question.length - prefix.length;
  if (room < 8) return question;
  const clipped = label.length > room ? `${label.slice(0, room - 1)}…` : label;
  return `${question}${prefix}${clipped}`;
};

export const tourHelpAnchor = (
  snap: TourHelpSnap,
  narrow: boolean,
): TourHelpAnchor => {
  if (narrow && snap === 'half') {
    return {
      bottom: 'calc(50% + 12px)',
      width: 'min(400px, calc(100vw - 16px))',
      maxHeight: 'min(200px, max(140px, calc(50vh - 200px)))',
    };
  }

  const bottom =
    narrow && snap === 'quarter'
      ? QUARTER_PEEK_PX + CONTROL_CLEARANCE
      : CONTROL_CLEARANCE;
  const topReserve = narrow ? 180 : 260;
  // Tall enough for the three starter questions above the composer.
  const cap = 420;

  return {
    bottom,
    width: narrow
      ? 'min(400px, calc(100vw - 16px))'
      : 'min(360px, calc(100vw - var(--feature-panel-width, 480px) - 16px))',
    maxHeight: `min(${cap}px, calc(100dvh - ${bottom + topReserve}px))`,
  };
};
