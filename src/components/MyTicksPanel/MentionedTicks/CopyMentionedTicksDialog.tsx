import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from '@mui/material';
import { t } from '../../../services/intl';
import { TickStyle } from '../../FeaturePanel/Climbing/types';
import { TickStyleSelect } from '../../FeaturePanel/Climbing/Ticks/TickStyleSelect';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { CopyStyleOption } from '../../../services/my-ticks/tickMentions';

type Props = {
  count: number;
  onClose: () => void;
  onConfirm: (styleOption: CopyStyleOption) => Promise<void>;
};

export const CopyMentionedTicksDialog = ({
  count,
  onClose,
  onConfirm,
}: Props) => {
  const { userSettings } = useUserSettingsContext();
  const [mode, setMode] = useState<'original' | 'fixed'>('original');
  const [style, setStyle] = useState<TickStyle>(
    userSettings['climbing.defaultClimbingStyle'] ?? 'OS',
  );
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(
        mode === 'fixed' ? { kind: 'fixed', style } : { kind: 'original' },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 2 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {t('my_ticks.mentions.copy_title', { count: String(count) })}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5, fontWeight: 400 }}
        >
          {t('my_ticks.mentions.copy_hint')}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <RadioGroup
          value={mode}
          onChange={(e) => setMode(e.target.value as 'original' | 'fixed')}
        >
          <FormControlLabel
            value="original"
            control={<Radio size="small" />}
            label={t('my_ticks.mentions.style_original')}
          />
          <FormControlLabel
            value="fixed"
            control={<Radio size="small" />}
            label={t('my_ticks.mentions.style_fixed')}
          />
        </RadioGroup>
        <Stack sx={{ pl: 4, pt: 1, opacity: mode === 'fixed' ? 1 : 0.6 }}>
          <TickStyleSelect
            fullWidth
            value={style}
            onChange={(e) => {
              setStyle(e.target.value);
              setMode('fixed');
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          {t('editdialog.cancel_button')}
        </Button>
        <Button variant="contained" onClick={handleConfirm} loading={loading}>
          {t('my_ticks.mentions.copy_confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
