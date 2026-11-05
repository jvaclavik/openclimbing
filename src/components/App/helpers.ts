import * as Sentry from '@sentry/nextjs';
import nextCookies from 'next-cookies';
import Cookies from 'js-cookie';
import { clearFeatureCache } from '../../services/osm/osmApi';
import { fetchFeatureFromTiles } from '../../services/osm/fetchFeatureFromTiles';
import { isServer } from '../helpers';
import { getCoordsFeature } from '../../services/getCoordsFeature';
import { getOsmappLink, getShortId } from '../../services/helpers';
import { Feature, OsmId } from '../../services/types';
import { View } from '../utils/MapStateContext';
import { NextPageContext } from 'next';

// Franconia (Würzburg / Fränkische Schweiz) and the northern Alps.
// Zoom 6.5 around 48.5°N 11°E shows both. A #z/lat/lon hash and the mapView
// cookie still win — see getMapViewFromHash() in _app.
export const DEFAULT_VIEW: View = ['6.5', '48.5', '11'];

export const getInitialMapView = async (
  ctx: NextPageContext,
): Promise<View> => {
  const cookies = nextCookies(ctx);
  const viewCookie = cookies.mapView;
  return viewCookie ? (viewCookie.split('/') as View) : DEFAULT_VIEW;
};

const saveLastUrl = (feature: Feature, ctx?: NextPageContext) => {
  const url = getOsmappLink(feature);
  if (ctx?.res) {
    ctx.res.setHeader('Set-Cookie', `last-url=${url}; Path=/; Max-Age=86400`);
  } else {
    Cookies.set('last-url', url, { expires: 1, path: '/' });
  }
};

const getValidApiId = (path: string[]): OsmId => {
  const [type, id] = path;
  if (type?.match(/^node|way|relation$/) && id?.match(/^\d+$/)) {
    return { type: path[0], id: parseInt(path[1], 10) } as OsmId;
  }
  return null;
};
export const getInitialFeature = async (
  ctx: NextPageContext,
): Promise<Feature | '404' | null> => {
  if (ctx.pathname !== '/[...all]') {
    return null;
  }

  const path = ctx.query.all as string[];

  // url: "/"
  if (!path) {
    return null;
  }

  if (path[0].match(/^[-.0-9]+,[-.0-9]+$/)) {
    const [lat, lon] = path[0].split(',');
    const coordsFeature = getCoordsFeature([lon, lat]);
    saveLastUrl(coordsFeature, ctx);
    return coordsFeature;
  }

  const apiId = getValidApiId(path);
  if (!apiId) {
    return '404';
  }

  if (isServer()) {
    // we need always fresh OSM element, b/c user can edit a feature and refresh the page
    // (other requests like overpass may be cached) - only matters for the OSM fallback
    clearFeatureCache(apiId);
  }

  const t1 = new Date().getTime();

  // Fast path: read the feature from the climbing-tiles SQLite DB (server) or
  // the /api/climbing-tiles/get endpoint (browser). Falls back to OSM/Overpass
  // when the feature is not in the DB (e.g. non-climbing POI) or on any error.
  const initialFeature = await fetchFeatureFromTiles(apiId);
  saveLastUrl(initialFeature, ctx);

  const t2 = new Date().getTime();
  const time = t2 - t1;
  console.log(`getInitialFeature()`, getShortId(apiId), `${time}ms`); // eslint-disable-line no-console
  Sentry.metrics.distribution('getInitialFeature', time, {
    tags: { ...apiId, ssr: isServer() },
    unit: 'millisecond',
  });

  return initialFeature;
};

export const getMapViewFromHash = (): View | undefined => {
  const view = global.window?.location.hash
    .substring(1)
    .split('/')
    .map(parseFloat) //we want to parse numbers, then serialize back in usePersistMapView()
    .filter((num) => !Number.isNaN(num))
    .map((num) => num.toString());
  return view?.length === 3 ? (view as View) : undefined;
};
