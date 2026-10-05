import {
  DEFAULT_GRADE_SYSTEM,
  GRADE_SYSTEMS,
  GradeSystem,
  normalizeGradeSystemKey,
} from '../../../services/tagging/climbing/gradeSystems';
import { UserSettingsType } from './UserSettingsContext';

export const getGradeSystem = (userSettings: UserSettingsType): GradeSystem => {
  const user = normalizeGradeSystemKey(
    (userSettings['climbing.gradeSystem'] as string | null | undefined) ?? '',
  ) as GradeSystem;
  if (GRADE_SYSTEMS.some((system) => system.key === user)) {
    return user;
  }
  return DEFAULT_GRADE_SYSTEM;
};

export const migrateUserSettings = (
  settings: UserSettingsType,
): UserSettingsType => {
  const gradeSystem = settings['climbing.gradeSystem'] as
    | string
    | null
    | undefined;
  const visible = settings['climbing.visibleGradeSystems'];
  const gradeChanged =
    typeof gradeSystem === 'string' &&
    normalizeGradeSystemKey(gradeSystem) !== gradeSystem;
  const visibleHasLegacy = !!visible && 'fb' in visible;

  if (!gradeChanged && !visibleHasLegacy) {
    return settings;
  }

  const next: UserSettingsType = { ...settings };
  if (gradeChanged && typeof gradeSystem === 'string') {
    next['climbing.gradeSystem'] = normalizeGradeSystemKey(
      gradeSystem,
    ) as GradeSystem;
  }
  if (visible && visibleHasLegacy) {
    const { fb, ...rest } = visible;
    next['climbing.visibleGradeSystems'] = {
      ...rest,
      font: rest.font ?? fb,
    };
  }
  return next;
};
