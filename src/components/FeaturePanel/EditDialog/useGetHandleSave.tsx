import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { useEditDialogFeature } from './utils';
import { useEditContext } from './context/EditContext';
import { t } from '../../../services/intl';
import { saveChanges } from '../../../services/osm/auth/osmApiAuth';
import { useSnackbar } from '../../utils/SnackbarContext';
import { useEditDialogContext } from '../helpers/EditDialogContext';

export const useGetHandleSave = () => {
  const { showToast } = useSnackbar();
  const { loggedIn, handleLoginAsync, handleLogout } = useOsmAuthContext();
  const { feature } = useEditDialogFeature();
  const { setRedirectOnClose } = useEditDialogContext();
  const { setSuccessInfo, setIsSaving, comment, items, setValidate } =
    useEditContext();

  return async () => {
    try {
      if (
        items
          .filter(({ shortId }) => shortId[0] === 'n')
          .some(({ nodeLonLat }) => nodeLonLat === undefined)
      ) {
        showToast(t('editdialog.set_location_for_all_items'), 'warning');
        setValidate(true);
        return;
      }

      if (!loggedIn) {
        try {
          await handleLoginAsync();
        } catch {
          showToast(t('editdialog.login_required'), 'warning');
          return;
        }
      }

      setIsSaving(true);

      const changes = items.filter((item) => item.modified);
      const successInfo = await saveChanges(feature, comment, changes);

      setSuccessInfo(successInfo);
      setRedirectOnClose(successInfo.redirect);
      setTimeout(() => setIsSaving(false), 500);
    } catch (err) {
      setIsSaving(false);
      if (err?.status === 401) {
        showToast(t('editdialog.osm_session_expired'), 'error');
        handleLogout();
      } else {
        showToast(
          `${t('editdialog.save_refused')} ${err.responseText ?? err.message ?? err}`,
          'error',
        );
        console.error(err); // eslint-disable-line no-console
      }
    }
  };
};
