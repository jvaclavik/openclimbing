import CheckIcon from '@mui/icons-material/Check';
import { Button } from '@mui/material';
import { useState } from 'react';
import { getShortId } from '../../../../services/helpers';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { useOsmAuthContext } from '../../../utils/OsmAuthContext';
import { useSnackbar } from '../../../utils/SnackbarContext';
import { useTicksContext } from '../../../utils/TicksContext';
import { t } from '../../../../services/intl';

export const AddTickButton = () => {
  const { addTick, isTicked } = useTicksContext();
  const { feature } = useFeatureContext();
  const { loggedIn } = useOsmAuthContext();
  const { showToast } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const ticked = isTicked(getShortId(feature.osmMeta));

  const onClick = async () => {
    if (!loggedIn) {
      showToast(t('tick.login_required_to_add'), 'warning');
      return;
    }

    setLoading(true);
    try {
      await addTick(getShortId(feature.osmMeta));
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={onClick}
        color="secondary"
        size="small"
        variant="contained"
        endIcon={<CheckIcon color={ticked ? 'success' : undefined} />}
        loading={loading}
      >
        {t('tick.add_button')}
      </Button>
    </>
  );
};
