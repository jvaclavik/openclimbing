const OFFSET = 0x1f1e6 - 'A'.charCodeAt(0);

const normalizeCode = (countryCode?: string | null): string | null => {
  const cc = countryCode?.toUpperCase();
  return cc && /^[A-Z]{2}$/.test(cc) ? cc : null;
};

// Converts an ISO 3166-1 alpha-2 code (e.g. 'cz') to a flag emoji ('🇨🇿')
// using Unicode regional indicator symbols.
export const getCountryFlag = (countryCode?: string | null): string => {
  const cc = normalizeCode(countryCode);
  if (!cc) {
    return '';
  }
  return String.fromCodePoint(
    ...[...cc].map((char) => OFFSET + char.charCodeAt(0)),
  );
};

// Localized country name for an ISO 3166-1 alpha-2 code, e.g. 'cz' -> 'Česko'.
export const getCountryName = (
  countryCode?: string | null,
  lang?: string,
): string => {
  const cc = normalizeCode(countryCode);
  if (!cc) {
    return '';
  }
  try {
    const displayNames = new Intl.DisplayNames([lang || 'en'], {
      type: 'region',
    });
    return displayNames.of(cc) ?? cc;
  } catch {
    return cc;
  }
};
