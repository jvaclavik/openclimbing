import React, { createContext, useContext } from 'react';
import {
  GRADE_SYSTEMS,
  GradeSystem,
} from '../../../services/tagging/climbing/gradeSystems';
import { Setter } from '../../../types';
import { TickStyle } from '../../FeaturePanel/Climbing/types';
import { DIRECTED_PITCH_SPACING_M } from '../../FeaturePanel/Climbing/utils/routeMapDistribution';
import { isMobileDevice } from '../../helpers';
import { usePersistedState } from '../usePersistedState';
import {
  ClimbingFilter,
  ClimbingFilterSettings,
  getClimbingFilter,
} from './getClimbingFilter';
import { getGradeSystem, migrateUserSettings } from './getGradeSystem';

type CragViewLayout = 'vertical' | 'horizontal' | 'auto';

export type EditMapPosition = 'auto' | 'right' | 'bottom';

export type TickDefaults = {
  style: TickStyle;
  timestamp: string;
  pairing: Record<string, string> | null;
  /** Local calendar day (yyyy-MM-dd) when defaults were saved. */
  savedOn?: string;
};

export type UserSettingsType = Partial<{
  isImperial: boolean;
  'climbing.gradeSystem': GradeSystem;
  'climbing.isGradesOnPhotosVisible': boolean;
  'climbing.defaultClimbingStyle': TickStyle;
  'climbing.rememberTickDefaults': boolean;
  'climbing.tickDefaults': TickDefaults | null;
  'climbing.selectRoutesByScrolling': boolean;
  'climbing.switchPhotosByScrolling': boolean;
  'climbing.showRelatedPhotoByRouteClick': boolean;
  'climbing.showProtectionPoints': boolean;
  'climbing.visibleGradeSystems': Record<string, boolean>;
  'climbing.cragViewLayout': CragViewLayout;
  'climbing.splitPaneSize': null | number;
  'climbing.filter': ClimbingFilterSettings;
  'editdialog.splitPaneSize': null | number;
  'editdialog.mapFullscreen': boolean;
  'editdialog.mapPosition': EditMapPosition;
  'editdialog.showRouteNames': boolean;
  'editdialog.showRouteGrades': boolean;
  'editdialog.lineHelpDismissed': boolean;
  'editdialog.groupMultipitch': boolean;
  /** Degrees clockwise from north. null stacks pitches almost on top of each other. */
  'editdialog.multipitchBearing': number | null;
  /** Metres between pitches of one route when a direction is set. */
  'editdialog.multipitchSpacing': number;
  'debug.enabled': boolean;
}>;

export type UserSettingsContextType = {
  userSettings: UserSettingsType;
  setUserSettings: Setter<UserSettingsType>;
  setUserSetting: <T extends keyof UserSettingsType>(
    key: T,
    value: UserSettingsType[T],
  ) => void;
  climbingFilter: ClimbingFilter;
  gradeSystem: GradeSystem;
};

const initialUserSettings: UserSettingsType = {
  // TODO remove initial settings and handle it as default in the usage code
  isImperial: false,
  'climbing.gradeSystem': null,
  'climbing.isGradesOnPhotosVisible': true,
  'climbing.defaultClimbingStyle': 'OS',
  'climbing.rememberTickDefaults': false,
  'climbing.tickDefaults': null,
  'climbing.selectRoutesByScrolling': isMobileDevice(),
  'climbing.switchPhotosByScrolling': true,
  'climbing.showRelatedPhotoByRouteClick': true,
  'climbing.visibleGradeSystems': GRADE_SYSTEMS.filter(
    ({ minor }) => !minor,
  ).reduce((acc, { key }) => ({ ...acc, [key]: true }), {}),
  'climbing.cragViewLayout': 'auto',
  'climbing.splitPaneSize': null,
  'editdialog.splitPaneSize': null,
  'editdialog.mapFullscreen': false,
  'editdialog.mapPosition': 'auto',
  'editdialog.showRouteNames': true,
  'editdialog.showRouteGrades': true,
  'editdialog.lineHelpDismissed': false,
  'editdialog.groupMultipitch': false,
  'editdialog.multipitchBearing': null,
  'editdialog.multipitchSpacing': DIRECTED_PITCH_SPACING_M,
};

export const UserSettingsContext =
  createContext<UserSettingsContextType>(undefined);

export const UserSettingsProvider: React.FC = ({ children }) => {
  const [userSettings, setUserSettings] = usePersistedState<UserSettingsType>(
    'userSettings',
    initialUserSettings,
    migrateUserSettings,
  );

  const setUserSetting = <T extends keyof UserSettingsType>(
    key: T,
    value: UserSettingsType[T],
  ) => {
    setUserSettings({ ...userSettings, [key]: value });
  };

  const value: UserSettingsContextType = {
    userSettings,
    setUserSetting,
    setUserSettings,
    climbingFilter: getClimbingFilter(userSettings, setUserSetting),
    gradeSystem: getGradeSystem(userSettings),
  };
  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettingsContext = () => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error(
      'useUserSettingsContext must be used within a UserSettingsProvider',
    );
  }
  return context;
};
