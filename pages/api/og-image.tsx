import type { NextApiRequest, NextApiResponse } from 'next';
import React from 'react';
import { UserThemeProvider } from '../../src/helpers/theme';
import { Paths } from '../../src/components/FeaturePanel/FeatureImages/PathsSvg';
import {
  Feature,
  ImageDef,
  ImageDefFromCenter,
  ImageDefFromTag,
  isTag,
  OsmId,
} from '../../src/services/types';
import { getImageFromApi } from '../../src/services/images/getImageFromApi';
import { getLogo, ProjectLogo } from '../../src/server/images/logo';
import { ImageType } from '../../src/services/images/getImageDefs';
import { fetchImage } from '../../src/server/images/fetchImage';
import {
  PNG_TYPE,
  sendImageResponse,
  SVG_TYPE,
} from '../../src/server/images/sendImageResponse';
import { svg2png } from '../../src/server/images/svg2png';
import { Size } from '../../src/components/FeaturePanel/FeatureImages/types';
import { getApiId, getShortId } from '../../src/services/helpers';
import { renderStyledHtml } from '../../src/server/images/renderStyledHtml';
import { fetchWithMemberFeatures } from '../../src/services/osm/fetchWithMemberFeatures';
import { getClimbingFeature } from '../../src/server/climbing-tiles/getClimbingFeature';
import { mockSchemaTranslations } from '../../src/services/tagging/translations';
import translations from '@openstreetmap/id-tagging-schema/dist/translations/en.json';
import { intl } from '../../src/services/intl';

const Svg = ({ children, size }) => (
  <UserThemeProvider userThemeCookie={undefined}>
    <svg
      viewBox={`0 0 ${size.width} ${size.height}`}
      width={size.width}
      height={size.height}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  </UserThemeProvider>
);

const OG_SIZE = { width: 1200, height: 630 };

const parsePhotoIndex = (raw: unknown): number => {
  if (typeof raw !== 'string') return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const parseRoutesParam = (raw: unknown): Set<string> | null => {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const ids = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length > 0 ? new Set(ids) : null;
};

/**
 * When `routes` is passed in the query, drop memberPaths whose member is not
 * in the allow-list. Lets clients ask for "this crag's topo, but only these
 * climbed routes drawn on it".
 *
 * Also drops def.path when the parent feature's own shortId is not in the
 * allow-list — this prevents the first promoted member path (see
 * mergeMemberImageDefs side-effect) from being drawn unfiltered.
 */
const filterMemberPathsByRoutes = (
  feature: Feature,
  def: ImageDef,
  routesRaw: unknown,
): ImageDef => {
  const allowed = parseRoutesParam(routesRaw);
  if (!allowed || !isTag(def)) return def;

  const memberShortIds =
    def.memberPaths?.map((mp) => getShortId(mp.member.osmMeta)) ?? [];

  const filteredMembers = def.memberPaths
    ? def.memberPaths.filter((mp) => allowed.has(getShortId(mp.member.osmMeta)))
    : undefined;

  const parentShortId = getShortId(feature.osmMeta);
  const keepParentPath = def.path ? allowed.has(parentShortId) : false;
  const filteredPath = keepParentPath ? def.path : undefined;

  // eslint-disable-next-line no-console
  console.log(
    `og-image filter:\n` +
      `  allowed     = [${[...allowed].join(', ')}]\n` +
      `  parent      = ${parentShortId} (path=${
        def.path ? 'present' : 'absent'
      }, kept=${keepParentPath})\n` +
      `  memberPaths = [${memberShortIds.join(', ')}] (${
        memberShortIds.length
      } total)\n` +
      `  after       = ${filteredMembers?.length ?? 0} kept`,
  );

  return { ...def, memberPaths: filteredMembers, path: filteredPath };
};

const centerInOgSize = (size: Size) => {
  const scale = Math.min(
    OG_SIZE.width / size.width,
    OG_SIZE.height / size.height,
  );
  const left = (OG_SIZE.width - size.width * scale) / 2;
  const top = (OG_SIZE.height - size.height * scale) / 2;
  return `translate(${left},${top}) scale(${scale})`;
};

type RenderedSvg = { html: string; canvasSize: Size };

const renderSvg = async (
  feature: Feature,
  def: ImageDefFromTag | ImageDefFromCenter,
  image: ImageType,
  raw: boolean,
): Promise<RenderedSvg> => {
  const { size, dataUrl } = await fetchImage(image.imageUrl);

  const Root = raw
    ? () => (
        <Svg size={size}>
          __PLACEHOLDER_FOR_STYLE__
          <image href={dataUrl} width={size.width} height={size.height} />
          <Paths def={def} feature={feature} size={size} />
        </Svg>
      )
    : () => (
        <Svg size={OG_SIZE}>
          __PLACEHOLDER_FOR_STYLE__
          <g transform={centerInOgSize(size)}>
            <image href={dataUrl} width={size.width} height={size.height} />
            <Paths def={def} feature={feature} size={size} />
          </g>
          <ProjectLogo logo={getLogo(OG_SIZE, !!feature.tags.climbing)} />
        </Svg>
      );

  const { html, styleTags } = renderStyledHtml(<Root />);
  return {
    html: html.replace('__PLACEHOLDER_FOR_STYLE__', styleTags),
    canvasSize: raw ? size : OG_SIZE,
  };
};

/**
 * Loads the feature for the OG image. Fast path reads it from the local
 * climbing-tiles SQLite DB (no OSM/Overpass round-trip). Falls back to the OSM
 * full fetch when the feature is not in the DB, on any error, or when the
 * caller explicitly asks for fresh data (`?fresh=1`).
 */
const getOgFeature = async (
  osmId: OsmId,
  nocache: boolean,
): Promise<Feature> => {
  if (!nocache) {
    try {
      return (await getClimbingFeature(
        osmId.type,
        osmId.id,
      )) as unknown as Feature;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(
        'og-image: climbing-tiles miss, falling back to OSM:',
        e instanceof Error ? e.message : e,
      );
    }
  }
  return fetchWithMemberFeatures(osmId, { nocache });
};

// on vercel node ~800ms in total
// - api/image: 838ms; fetchFeature: 496ms, getImage: 102ms, renderSvg: 38ms, svg2png: 202ms
// - api/image: 953ms; fetchFeature: 765ms, getImage: 0ms, renderSvg: 23ms, svg2png: 165ms
export default async (req: NextApiRequest, res: NextApiResponse) => {
  const t1 = Date.now();
  try {
    intl.lang = 'en';
    mockSchemaTranslations(translations); // local is fine, TODO remove the need for translations in this case

    const osmId = getApiId(req.query.id as string);
    const nocache = req.query.fresh === '1' || req.query.fresh === 'true';
    const feature = await getOgFeature(osmId, nocache);
    const photoIndex = parsePhotoIndex(req.query.photoIndex);
    const selectedDef = feature.imageDefs?.[photoIndex];
    if (!selectedDef) {
      throw new Error(
        `No image definition at index ${photoIndex} (have ${
          feature.imageDefs?.length ?? 0
        })`,
      );
    }
    const def = filterMemberPathsByRoutes(
      feature,
      selectedDef,
      req.query.routes,
    );

    const t2 = Date.now();
    const image = await getImageFromApi(def);
    if (!image) {
      throw new Error(`Image failed to load from API: ${JSON.stringify(def)}`);
    }

    const t3 = Date.now();
    const raw = req.query.raw === '1' || req.query.raw === 'true';
    const { html: svg, canvasSize } = await renderSvg(feature, def, image, raw);

    if (req.query.svg) {
      sendImageResponse(res, feature, svg, SVG_TYPE);
      return;
    }

    const t4 = Date.now();
    const png = await svg2png(svg, canvasSize);

    const t5 = Date.now();
    // eslint-disable-next-line no-console
    console.log(
      `api/og-image: ${t5 - t1}ms; fetchFeature: ${t2 - t1}ms, getImageUrl: ${
        t3 - t2
      }ms, fetchImage+renderSvg: ${t4 - t3}ms, svg2png: ${t5 - t4}ms`,
    );

    sendImageResponse(res, feature, png, PNG_TYPE);
    return;
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
    res.status(500).send(String(err));
  }
};
