import React from 'react';
import { Alert, Button } from '@mui/material';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import { DEFAULT_DATA_FORMAT } from '../../config.mjs';
import { t } from '../../services/intl';
import {
  TicksUrlFilter,
  clearTicksUrlFilter,
} from '../../services/my-ticks/ticksUrlFilter';

type Props = {
  filter: TicksUrlFilter;
  matchedCount: number;
  totalCount: number;
};

const formatSessionLabel = (sessionIso: string): string => {
  try {
    return format(parseISO(sessionIso), DEFAULT_DATA_FORMAT);
  } catch {
    return sessionIso;
  }
};

export const TicksFilterBanner = ({
  filter,
  matchedCount,
  totalCount,
}: Props) => {
  const router = useRouter();

  const message = filter.session
    ? t('my_ticks.filter.session_label', {
        date: formatSessionLabel(filter.session),
        matched: String(matchedCount),
        total: String(totalCount),
      })
    : t('my_ticks.filter.highlight_label');

  return (
    <Alert
      severity="info"
      variant="outlined"
      sx={{ mb: 1 }}
      action={
        <Button
          color="inherit"
          size="small"
          onClick={() => clearTicksUrlFilter(router)}
        >
          {t('my_ticks.filter.show_all')}
        </Button>
      }
    >
      {message}
    </Alert>
  );
};
