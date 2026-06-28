import { Alert, AlertTitle } from '@mui/material';
import { t } from '../../../services/intl';
import { useFeatureContext } from '../../utils/FeatureContext';

export const ClimbingRestriction = () => {
  const { feature } = useFeatureContext();

  if (!feature.tags.climbing) {
    return null;
  }

  const restriction = feature.tags['climbing:restriction'];
  const restrictionTimeDescription =
    feature.tags['climbing:restriction:time_description'];

  if (!restriction && !restrictionTimeDescription) {
    return null;
  }

  return (
    <Alert
      severity={restriction === 'yes' ? 'error' : 'warning'}
      sx={{ mb: 2 }}
    >
      <AlertTitle>{t('featurepanel.climbing_restriction')}</AlertTitle>
      {restrictionTimeDescription}
    </Alert>
  );
};
