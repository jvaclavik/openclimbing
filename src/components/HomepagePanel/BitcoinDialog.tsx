import styled from '@emotion/styled';
import CloseIcon from '@mui/icons-material/Close';
import {
  AppBar,
  Dialog,
  DialogContent,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { useUserThemeContext } from '../../helpers/theme';
import { t } from '../../services/intl';

const Qr = styled.img<{ $isDark: boolean }>`
  ${({ $isDark }) => $isDark && `filter: invert(1);`}
`;

type BitcoinDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const BitcoinDialog = ({ open, onClose }: BitcoinDialogProps) => {
  const { currentTheme } = useUserThemeContext();
  const isDark = currentTheme === 'dark';

  return (
    <Dialog open={open} onClose={onClose}>
      <AppBar position="static" color="transparent">
        <Toolbar>
          <Typography noWrap variant="h6" component="div">
            {t('support_us.bitcoin_dialog_title')}
          </Typography>
          <Tooltip title={t('close_panel')}>
            <IconButton
              color="primary"
              edge="end"
              onClick={onClose}
              sx={{ ml: 'auto' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <DialogContent dividers>
        <Qr src="/openclimbing/btcln.png" $isDark={isDark} />
        <Typography variant="body1">openclimbing@lnbits.cz</Typography>
      </DialogContent>
    </Dialog>
  );
};
