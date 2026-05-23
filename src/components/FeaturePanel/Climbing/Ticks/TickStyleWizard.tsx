import React, { useState } from 'react';
import { Box, Button, Collapse, Stack, Typography, alpha } from '@mui/material';
import styled from '@emotion/styled';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TickStyle } from '../types';
import { tickStyles } from '../../../../services/my-ticks/ticks';
import { t } from '../../../../services/intl';

type Method = 'lead' | 'tr' | 'solo' | 'aid';
type YesNo = 'yes' | 'no';

type Answers = {
  clean?: YesNo;
  method?: Method;
  firstAttempt?: YesNo;
  beta?: YesNo;
  prePlaced?: YesNo;
};

const resolveStyle = (a: Answers): TickStyle | null => {
  if (a.clean === 'no') return 'PJ';
  if (a.clean !== 'yes') return null;
  if (a.method === 'tr') return 'TR';
  if (a.method === 'solo') return 'FS';
  if (a.method === 'aid') return 'RK';
  if (a.method !== 'lead') return null;
  if (!a.prePlaced) return null;
  if (a.firstAttempt === 'yes') {
    if (a.beta === 'no') return 'OS';
    if (a.beta === 'yes') return 'FL';
    return null;
  }
  if (a.firstAttempt === 'no') {
    return a.prePlaced === 'yes' ? 'PP' : 'RP';
  }
  return null;
};

const StepBox = styled(Box)(({ theme }: any) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 8,
  padding: 12,
  background: alpha(theme.palette.primary.main, 0.04),
}));

type WizardProps = {
  onSelect: (style: TickStyle) => void;
};

export const TickStyleWizard = ({ onSelect }: WizardProps) => {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});

  const reset = () => setAnswers({});

  const goBack = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (next.beta) {
        delete next.beta;
        return next;
      }
      if (next.firstAttempt) {
        delete next.firstAttempt;
        return next;
      }
      if (next.prePlaced) {
        delete next.prePlaced;
        return next;
      }
      if (next.method) {
        delete next.method;
        return next;
      }
      if (next.clean) {
        delete next.clean;
        return next;
      }
      return next;
    });
  };

  const finalStyle = resolveStyle(answers);
  const styleConfig = finalStyle
    ? tickStyles.find((s) => s.key === finalStyle)
    : null;
  const hasAnyAnswer = Object.keys(answers).length > 0;

  const handleApply = () => {
    if (!finalStyle) return;
    onSelect(finalStyle);
    setOpen(false);
    reset();
  };

  // Determine which question to render.
  let questionNode: React.ReactNode = null;
  if (finalStyle) {
    questionNode = (
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CheckCircleIcon fontSize="small" color="success" />
          <Typography variant="subtitle2">
            {t('tick.wizard.result_label')}
          </Typography>
          <Typography variant="subtitle2" fontWeight={700}>
            {styleConfig?.name}
          </Typography>
        </Stack>
        {styleConfig?.description && (
          <Typography variant="body2" color="text.secondary">
            {styleConfig.description}
          </Typography>
        )}
        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleApply}
            startIcon={<CheckCircleIcon />}
          >
            {t('tick.wizard.apply')}
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={reset}
            startIcon={<RestartAltIcon />}
          >
            {t('tick.wizard.start_over')}
          </Button>
        </Stack>
      </Stack>
    );
  } else if (!answers.clean) {
    questionNode = (
      <Question
        title={t('tick.wizard.q_clean')}
        helper={t('tick.wizard.q_clean_helper')}
        options={[
          {
            label: t('tick.wizard.a_clean_yes'),
            onClick: () => setAnswers({ clean: 'yes' }),
          },
          {
            label: t('tick.wizard.a_clean_no'),
            onClick: () => setAnswers({ clean: 'no' }),
          },
        ]}
      />
    );
  } else if (!answers.method) {
    questionNode = (
      <Question
        title={t('tick.wizard.q_method')}
        options={[
          {
            label: t('tick.wizard.a_method_lead'),
            onClick: () => setAnswers({ ...answers, method: 'lead' }),
          },
          {
            label: t('tick.wizard.a_method_tr'),
            onClick: () => setAnswers({ ...answers, method: 'tr' }),
          },
          {
            label: t('tick.wizard.a_method_aid'),
            onClick: () => setAnswers({ ...answers, method: 'aid' }),
          },
          {
            label: t('tick.wizard.a_method_solo'),
            onClick: () => setAnswers({ ...answers, method: 'solo' }),
          },
        ]}
      />
    );
  } else if (!answers.prePlaced) {
    questionNode = (
      <Question
        title={t('tick.wizard.q_preplaced')}
        helper={t('tick.wizard.q_preplaced_helper')}
        options={[
          {
            label: t('tick.wizard.a_preplaced_no'),
            onClick: () => setAnswers({ ...answers, prePlaced: 'no' }),
          },
          {
            label: t('tick.wizard.a_preplaced_yes'),
            onClick: () => setAnswers({ ...answers, prePlaced: 'yes' }),
          },
        ]}
      />
    );
  } else if (!answers.firstAttempt) {
    questionNode = (
      <Question
        title={t('tick.wizard.q_first_attempt')}
        options={[
          {
            label: t('tick.wizard.a_first_attempt_yes'),
            onClick: () => setAnswers({ ...answers, firstAttempt: 'yes' }),
          },
          {
            label: t('tick.wizard.a_first_attempt_no'),
            onClick: () => setAnswers({ ...answers, firstAttempt: 'no' }),
          },
        ]}
      />
    );
  } else if (answers.firstAttempt === 'yes' && !answers.beta) {
    questionNode = (
      <Question
        title={t('tick.wizard.q_beta')}
        helper={t('tick.wizard.q_beta_helper')}
        options={[
          {
            label: t('tick.wizard.a_beta_no'),
            onClick: () => setAnswers({ ...answers, beta: 'no' }),
          },
          {
            label: t('tick.wizard.a_beta_yes'),
            onClick: () => setAnswers({ ...answers, beta: 'yes' }),
          },
        ]}
      />
    );
  }

  return (
    <Box>
      <Button
        variant="text"
        size="small"
        color="primary"
        startIcon={<HelpOutlineIcon />}
        onClick={() => {
          if (open) reset();
          setOpen((v) => !v);
        }}
        sx={{ textTransform: 'none', alignSelf: 'flex-start', px: 0.5 }}
      >
        {open ? t('tick.wizard.close') : t('tick.wizard.toggle')}
      </Button>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <StepBox sx={{ mt: 1 }}>
          <Stack spacing={1.5}>
            {questionNode}
            {hasAnyAnswer && !finalStyle && (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  color="inherit"
                  onClick={goBack}
                  startIcon={<ArrowBackIcon />}
                >
                  {t('tick.wizard.back')}
                </Button>
                <Button
                  size="small"
                  color="inherit"
                  onClick={reset}
                  startIcon={<RestartAltIcon />}
                >
                  {t('tick.wizard.start_over')}
                </Button>
              </Stack>
            )}
          </Stack>
        </StepBox>
      </Collapse>
    </Box>
  );
};

type QuestionProps = {
  title: string;
  helper?: string;
  options: Array<{ label: string; onClick: () => void }>;
};

const Question = ({ title, helper, options }: QuestionProps) => (
  <Stack spacing={1}>
    <Typography variant="subtitle2">{title}</Typography>
    {helper && (
      <Typography variant="caption" color="text.secondary">
        {helper}
      </Typography>
    )}
    <Stack spacing={0.75} sx={{ pt: 0.5 }}>
      {options.map((opt) => (
        <Button
          key={opt.label}
          variant="outlined"
          size="small"
          onClick={opt.onClick}
          sx={{
            justifyContent: 'flex-start',
            textTransform: 'none',
            textAlign: 'left',
          }}
        >
          {opt.label}
        </Button>
      ))}
    </Stack>
  </Stack>
);
