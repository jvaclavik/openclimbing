import { useFeatureContext } from '../../utils/FeatureContext';
import { getWikimediaCommonsPhotoKeys } from './utils/photo';
import { getCommonsImageUrl } from '../../../services/images/getCommonsImageUrl';
import { getHumanPoiType, getLabel } from '../../../helpers/featureLabel';
import { generateFeatureDescription } from '../../../helpers/generateFeatureDescription';
import { getFullOsmappLink } from '../../../services/helpers';
import { Feature } from '../../../services/types';
import {
  findOrConvertRouteGrade,
  getDifficulties,
} from '../../../services/tagging/climbing/routeGrade';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { getGradeSystemName } from '../../../services/tagging/climbing/gradeSystems';
import Head from 'next/head';

const generateScriptContent = (feature, userSettings) => {
  const isClimbingArea = feature.tags.climbing === 'area';
  const isClimbingCrag = feature.tags.climbing === 'crag';
  const isClimbingRoute = feature.tags.climbing === 'route_bottom';
  const poiType = getHumanPoiType(feature);
  const description =
    feature.tags.description || generateFeatureDescription(feature);

  if (isClimbingArea) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: `${feature.tags.name} - ${poiType}`,
      ...(description ? { description } : {}),
      geo: {
        '@type': 'GeoCoordinates',
        latitude: feature.center?.[1],
        longitude: feature.center?.[0],
      },
    };
  }

  if (isClimbingCrag) {
    const photoPaths = getWikimediaCommonsPhotoKeys(feature.tags);
    return {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: `${feature.tags.name} - ${poiType}`,
      ...(photoPaths.length > 0
        ? {
            image: photoPaths.map((photoPath) =>
              getCommonsImageUrl(feature.tags[photoPath], 960),
            ),
          }
        : {}),
      ...(description ? { description } : {}),

      geo: {
        '@type': 'GeoCoordinates',
        latitude: feature.center?.[1],
        longitude: feature.center?.[0],
      },
    };
  }

  if (isClimbingRoute) {
    const photoPaths = getWikimediaCommonsPhotoKeys(feature.tags);
    const selectedRouteSystem = userSettings['climbing.gradeSystem'];
    const routeDifficulties = getDifficulties(feature.tags);
    const { routeDifficulty } = findOrConvertRouteGrade(
      routeDifficulties,
      selectedRouteSystem,
    );

    return {
      '@context': 'https://schema.org',
      '@type': 'Route',
      name: `${feature.tags.name} - ${poiType}`,
      ...(photoPaths.length > 0
        ? {
            image: photoPaths.map((photoPath) =>
              getCommonsImageUrl(feature.tags[photoPath], 960),
            ),
          }
        : {}),
      ...(description ? { description } : {}),
      difficulty: `${routeDifficulty.grade} (${getGradeSystemName(routeDifficulty.gradeSystem)})`,
      geo: {
        '@type': 'GeoCoordinates',
        latitude: feature.center?.[1],
        longitude: feature.center?.[0],
      },
    };
  }

  return null;
};

// Breadcrumb trail from the climbing hierarchy (area > crag > route). parentFeatures
// is ordered nearest-first, so we reverse it to put the root area first.
const generateBreadcrumbList = (feature: Feature) => {
  const parents = (feature.parentFeatures ?? [])
    .filter((parent) => parent.tags?.climbing)
    .reverse();
  const chain = [...parents, feature];

  if (chain.length < 2) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: chain.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: getLabel(item),
      item: getFullOsmappLink(item),
    })),
  };
};

export const ClimbingStructuredData = () => {
  const { feature } = useFeatureContext();
  const { userSettings } = useUserSettingsContext();

  const structuredData = generateScriptContent(feature, userSettings);
  const breadcrumbList = feature ? generateBreadcrumbList(feature) : null;

  if (!structuredData && !breadcrumbList) return null;

  return (
    <Head>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      {breadcrumbList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbList),
          }}
        />
      )}
    </Head>
  );
};
