import React from 'react';
import Router from 'next/router';
import { Alert, AlertTitle, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { t } from '../../services/intl';
import { getReactKey } from '../../services/helpers';
import { useFeatureContext } from '../utils/FeatureContext';
import { PanelSidePadding } from '../utils/PanelHelpers';
import { isCrashDebugEnabled, reportReactError } from '../App/crashOverlay';

type Props = {
  children: React.ReactNode;
  // Změna této hodnoty smaže chybový stav – panel se tak sám zotaví, když
  // uživatel přejde na jinou feature (aniž by se odsud dalo klikat).
  resetKey: string;
};
type State = { hasError: boolean };

/**
 * Lokální error boundary kolem obsahu FeaturePanelu. Když render panelu spadne,
 * nespadne celá appka (mapa i navigace zůstanou funkční) – zobrazí se jen
 * fallback uvnitř panelu a uživatel může kliknout dál.
 *
 * V debug módu chybu naopak NEchytáme a necháme ji probublat k celoobrazovkému
 * <CrashErrorBoundary>, aby šel report pohodlně zkopírovat (viz crashOverlay).
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    // V debug módu vrátíme false → render zopakuje children, ty spadnou znovu
    // a React chybu propaguje k nadřazenému <CrashErrorBoundary>.
    return { hasError: !isCrashDebugEnabled() };
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // I když chybu tady pohltíme, pošleme ji do reportu (v debug módu ji jinak
    // zachytí až probublání k CrashErrorBoundary – recordEntry to dedupuje).
    reportReactError(
      'feature-panel-boundary',
      error,
      info?.componentStack ?? undefined,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <PanelSidePadding>
          <Alert
            severity="warning"
            sx={{ my: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<ArrowBackIcon fontSize="inherit" />}
                onClick={() => Router.back()}
              >
                {t('featurepanel.error.back')}
              </Button>
            }
          >
            <AlertTitle>{t('featurepanel.error.title')}</AlertTitle>
            {t('featurepanel.error.description')}
          </Alert>
        </PanelSidePadding>
      );
    }
    return this.props.children;
  }
}

export const FeaturePanelErrorBoundary: React.FC = ({ children }) => {
  const { feature } = useFeatureContext();
  const resetKey = feature ? getReactKey(feature) : 'none';
  return <ErrorBoundary resetKey={resetKey}>{children}</ErrorBoundary>;
};
