import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { getUtfStrikethrough, join } from '../utils';
import { Feature } from '../services/types';
import { useFeatureContext } from '../components/utils/FeatureContext';
import { getFullOsmappLink, getShortId } from '../services/helpers';
import { getLabel, getParentLabel } from './featureLabel';
import { generateFeatureDescription } from './generateFeatureDescription';
import {
  PROJECT_ID,
  PROJECT_NAME,
  PROJECT_OG_IMAGE,
  PROJECT_SERP_DESCRIPTION,
  PROJECT_URL,
} from '../services/project';
import { t } from '../services/intl';

const isOpenClimbing = PROJECT_ID === 'openclimbing';

const getCustomLabel = (feature: Feature) => {
  switch (feature.tags.climbing) {
    case 'area':
      return `${getLabel(feature)} - ${t('project.openclimbing.climbing_guide')}`;
    case 'crag':
    case 'route_bottom':
      const parentLabel = getParentLabel(feature);
      return `${getLabel(feature)}${parentLabel ? `, ${parentLabel}` : ''} - ${t('project.openclimbing.climbing_guide')}`;
    default:
      return join(getLabel(feature), ' – ', getParentLabel(feature));
  }
};

const getTitleLabel = (feature: Feature) => {
  const label = getCustomLabel(feature);

  return feature.deleted ? getUtfStrikethrough(label) : label;
};

// Self-referencing canonical URL, incl. the locale prefix (default locale has
// none). asPath omits the locale but may carry the ?nxtPall= Vercel quirk.
const useCanonicalUrl = () => {
  const router = useRouter();
  const localePrefix =
    router.locale && router.locale !== 'default' ? `/${router.locale}` : '';
  const path = router.asPath.split(/[?#]/)[0].replace(/\/+$/, '');
  return `${PROJECT_URL}${localePrefix}${path}`;
};

// Google "sitelinks searchbox": the app opens search results at /?q=… (see
// useHandleQuery), so this SearchAction target is a real, working URL.
const getWebsiteJsonLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: PROJECT_URL,
  name: PROJECT_NAME,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${PROJECT_URL}/?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

export const TitleAndMetaTags = () => {
  const { feature } = useFeatureContext();
  const canonicalUrl = useCanonicalUrl();
  const router = useRouter();
  const isHomepage =
    !feature && router.asPath.split(/[?#]/)[0].replace(/\/+$/, '') === '';

  if (feature) {
    const url = getFullOsmappLink(feature);
    const titleLabel = getTitleLabel(feature);
    const title = `${titleLabel} | ${PROJECT_NAME}`;
    const description =
      feature.tags.description ||
      generateFeatureDescription(feature) ||
      t(PROJECT_SERP_DESCRIPTION);
    const { center } = feature;

    const image = feature.imageDefs?.length
      ? `${PROJECT_URL}/api/og-image?id=${getShortId(feature.osmMeta)}`
      : PROJECT_OG_IMAGE;
    return (
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        {center && (
          <>
            <meta
              property="place:location:longitude"
              content={`${center[0]}`}
            />
            <meta property="place:location:latitude" content={`${center[1]}`} />
          </>
        )}
        <meta property="og:site_name" content={PROJECT_NAME} />
        {image && <meta property="og:image" content={image} />}
        <meta property="og:description" content={description} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="twitter:url" content={url} />
        {image && <meta name="twitter:image" content={image} />}
      </Head>
    );
  }

  const title = PROJECT_NAME;
  const url = PROJECT_URL;
  const image = PROJECT_OG_IMAGE;
  const description = t(PROJECT_SERP_DESCRIPTION);

  return (
    <Head>
      <title>
        {`${PROJECT_NAME}${isOpenClimbing ? ` | ${t('project.openclimbing.climbing_guide')}` : ''}`}
      </title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:site_name" content={PROJECT_NAME} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:description" content={description} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta property="twitter:url" content={url} />
      {image && <meta name="twitter:image" content={image} />}

      {isHomepage && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(getWebsiteJsonLd()),
          }}
        />
      )}
    </Head>
  );
};
