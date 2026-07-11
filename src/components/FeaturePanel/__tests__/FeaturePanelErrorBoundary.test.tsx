import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeaturePanelErrorBoundary } from '../FeaturePanelErrorBoundary';

jest.mock('../../../services/intl', () => ({ t: (key: string) => key }));

jest.mock('../../utils/PanelHelpers', () => ({
  PanelSidePadding: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock('../../../services/helpers', () => ({
  getReactKey: (feature: { id: number }) => String(feature?.id),
}));

const mockUseFeatureContext = jest.fn();
jest.mock('../../utils/FeatureContext', () => ({
  useFeatureContext: () => mockUseFeatureContext(),
}));

const reportReactError = jest.fn();
let debugMode = false;
jest.mock('../../App/crashOverlay', () => ({
  isCrashDebugEnabled: () => debugMode,
  reportReactError: (...args: unknown[]) => reportReactError(...args),
}));

const Boom = ({ explode }: { explode: boolean }) => {
  if (explode) throw new Error('boom in panel');
  return <div>panel-content</div>;
};

describe('FeaturePanelErrorBoundary', () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    debugMode = false;
    reportReactError.mockClear();
    mockUseFeatureContext.mockReturnValue({ feature: { id: 1 } });
    // React logs caught render errors to console.error – silence it.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders children when nothing throws', () => {
    render(
      <FeaturePanelErrorBoundary>
        <Boom explode={false} />
      </FeaturePanelErrorBoundary>,
    );

    expect(screen.queryByText('panel-content')).not.toBeNull();
  });

  it('shows the fallback and keeps siblings alive when a child throws', () => {
    render(
      <>
        <FeaturePanelErrorBoundary>
          <Boom explode />
        </FeaturePanelErrorBoundary>
        <div>map-still-interactive</div>
      </>,
    );

    // Panel body is replaced by the fallback...
    expect(screen.queryByText('featurepanel.error.title')).not.toBeNull();
    expect(screen.queryByText('panel-content')).toBeNull();
    // ...but the rest of the app (e.g. the map) keeps rendering.
    expect(screen.queryByText('map-still-interactive')).not.toBeNull();
    expect(reportReactError).toHaveBeenCalledTimes(1);
  });

  it('recovers when the user navigates to another feature (resetKey change)', () => {
    const { rerender } = render(
      <FeaturePanelErrorBoundary>
        <Boom explode />
      </FeaturePanelErrorBoundary>,
    );
    expect(screen.queryByText('featurepanel.error.title')).not.toBeNull();

    // Different feature -> resetKey changes -> boundary clears its error state.
    mockUseFeatureContext.mockReturnValue({ feature: { id: 2 } });
    rerender(
      <FeaturePanelErrorBoundary>
        <Boom explode={false} />
      </FeaturePanelErrorBoundary>,
    );

    expect(screen.queryByText('panel-content')).not.toBeNull();
    expect(screen.queryByText('featurepanel.error.title')).toBeNull();
  });

  it('re-throws in debug mode so the global crash overlay can catch it', () => {
    debugMode = true;

    expect(() =>
      render(
        <FeaturePanelErrorBoundary>
          <Boom explode />
        </FeaturePanelErrorBoundary>,
      ),
    ).toThrow('boom in panel');
  });
});
