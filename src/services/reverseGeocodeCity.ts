import { fetchJson } from './fetch';
import { intl } from './intl';

type PhotonProperties = {
  city?: string | null;
  town?: string | null;
  village?: string | null;
  locality?: string | null;
};

type PhotonReverseResponse = {
  features?: { properties?: PhotonProperties }[];
};

const photonLang = (lang: string) =>
  lang === 'de' || lang === 'fr' || lang === 'en' ? lang : 'en';

export const cityFromPhotonProperties = (
  props: PhotonProperties | undefined,
): string | null => {
  if (!props) return null;
  for (const value of [props.city, props.town, props.village, props.locality]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

export const fetchReverseCity = async (
  lon: number,
  lat: number,
): Promise<string | null> => {
  const lang = photonLang(intl.lang);
  const url = `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&lang=${lang}`;
  const data = await fetchJson<PhotonReverseResponse>(url);
  return cityFromPhotonProperties(data.features?.[0]?.properties);
};
