import { PROJECT_URL } from '../project';

const OSM_ORIGIN = 'https://www.openstreetmap.org';

/** Parse <img class="...user_image..."> from OSM /user/:name HTML (attribute order–agnostic). */
export const parseUserImageSrcFromOsmProfileHtml = (
  html: string,
): string | null => {
  const key = 'user_image';
  const idx = html.indexOf(key);
  if (idx === -1) {
    return null;
  }
  const start = html.lastIndexOf('<img', idx);
  if (start === -1) {
    return null;
  }
  const end = html.indexOf('>', idx);
  if (end === -1) {
    return null;
  }
  const tag = html.slice(start, end + 1);
  if (!tag.includes(key)) {
    return null;
  }
  const m = tag.match(/\bsrc="([^"]+)"/);
  if (!m) {
    return null;
  }
  let src = m[1];
  if (src.startsWith('//')) {
    src = `https:${src}`;
  } else if (src.startsWith('/')) {
    src = `${OSM_ORIGIN}${src}`;
  }
  return src || null;
};

const USER_AGENT = `OpenClimbing (+${PROJECT_URL}; fetchOsmPublicUserAvatarUrl)`;

export const fetchOsmPublicUserAvatarUrl = async (
  displayName: string,
): Promise<string | null> => {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return null;
  }

  const url = `${OSM_ORIGIN}/user/${encodeURIComponent(trimmed)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'follow',
  });

  if (!res.ok) {
    return null;
  }

  const html = await res.text();
  return parseUserImageSrcFromOsmProfileHtml(html);
};
