import { getGradeIndexFromTags } from '../../../../../services/tagging/climbing/routeGrade';
import { Feature, FeatureTags } from '../../../../../services/types';
import { useFeatureContext } from '../../../../utils/FeatureContext';
import { useUserSettingsContext } from '../../../../utils/userSettings/UserSettingsContext';

export const useGetMemberCrags = () => {
  const { feature } = useFeatureContext();
  return feature.memberFeatures.filter(({ tags }) => tags.climbing === 'crag');
};

const isTagSet = (value?: string) =>
  value !== undefined && value !== 'no' && value !== '0';

// matches the crag itself or any of its member routes
const someFeatureTags = (
  crag: Feature,
  predicate: (tags: FeatureTags) => boolean,
) =>
  predicate(crag.tags) ||
  crag.memberFeatures.some(({ tags }) => predicate(tags));

export const useGetFilteredCrags = (crags: Feature[]): Feature[] => {
  const { climbingFilter } = useUserSettingsContext();
  const {
    gradeInterval,
    minimumRoutes,
    isDefaultFilter,
    isGradeIntervalDefault,
    isMinimumRoutesDefault,
    climbingTypes,
    inclinations,
    materials,
    familyFriendly,
  } = climbingFilter;
  const [minIndex, maxIndex] = gradeInterval;

  if (isDefaultFilter) {
    return crags;
  }

  const matchesGrade = (crag: Feature) => {
    if (isGradeIntervalDefault && isMinimumRoutesDefault) {
      return true;
    }
    const filteredRoutes = crag.memberFeatures
      .map((route) => getGradeIndexFromTags(route.tags))
      .filter((gradeIndex) => gradeIndex >= minIndex && gradeIndex <= maxIndex);

    return filteredRoutes.length >= minimumRoutes;
  };

  const matchesClimbingTypes = (crag: Feature) =>
    climbingTypes.length === 0 ||
    climbingTypes.some((type) =>
      someFeatureTags(crag, (tags) => isTagSet(tags[`climbing:${type}`])),
    );

  const matchesInclinations = (crag: Feature) =>
    inclinations.length === 0 ||
    inclinations.some((inclination) =>
      someFeatureTags(crag, (tags) =>
        isTagSet(tags[`climbing:inclination:${inclination}`]),
      ),
    );

  const matchesMaterials = (crag: Feature) =>
    materials.length === 0 ||
    someFeatureTags(crag, (tags) => materials.includes(tags['climbing:rock']));

  const matchesFamilyFriendly = (crag: Feature) =>
    !familyFriendly ||
    someFeatureTags(crag, (tags) => isTagSet(tags['climbing:family_friendly']));

  return crags.filter(
    (crag) =>
      matchesGrade(crag) &&
      matchesClimbingTypes(crag) &&
      matchesInclinations(crag) &&
      matchesMaterials(crag) &&
      matchesFamilyFriendly(crag),
  );
};
