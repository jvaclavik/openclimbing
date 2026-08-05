import { resizeWikimediaThumbUrl } from './getCommonsImageUrl';
import { ImageType } from './getImageDefs';

const PLACEHOLDER_WIDTH = 40; // ~1 kB, arrives in the first round trip

// Providers that expose a tiny variant set `placeholderUrl` themselves, for
// everything hosted on Wikimedia we can derive it from the thumbnail URL.
export const getImagePlaceholderUrl = ({
  imageUrl,
  placeholderUrl,
}: ImageType): string | undefined =>
  placeholderUrl ??
  resizeWikimediaThumbUrl(imageUrl, PLACEHOLDER_WIDTH) ??
  undefined;
