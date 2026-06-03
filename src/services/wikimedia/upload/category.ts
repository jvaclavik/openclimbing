import { Feature } from '../../types';
import { findExistingCategory } from '../api';
import { getCountryNameForCategory } from './countryName';

const FALLBACK_CATEGORY = 'Climbing';

const buildCandidates = (feature: Feature): string[] => {
  const countryName = getCountryNameForCategory(feature.countryCode);
  const candidates: string[] = [];
  if (countryName) {
    candidates.push(`Climbing in ${countryName}`);
  }
  candidates.push(FALLBACK_CATEGORY);
  return candidates;
};

export const suggestCommonsCategories = async (
  feature: Feature,
): Promise<string[]> => {
  const candidates = buildCandidates(feature);
  try {
    const found = await findExistingCategory(candidates);
    return [found ?? FALLBACK_CATEGORY];
  } catch {
    return [candidates[0] ?? FALLBACK_CATEGORY];
  }
};
