import React from 'react';
import { act, render } from '@testing-library/react';
import {
  FEATURE_PANEL_MIN_WIDTH,
  FeaturePanelWidthSync,
  getFeaturePanelWidth,
  saveFeaturePanelWidth,
} from '../featurePanelWidth';

const STORAGE_KEY = 'featurePanelWidth';

describe('FeaturePanelWidthSync', () => {
  beforeEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window, 'innerWidth', {
      value: 1600,
      configurable: true,
    });
  });

  it('applies the width stored in localStorage', () => {
    window.localStorage.setItem(STORAGE_KEY, '650');
    render(<FeaturePanelWidthSync />);

    expect(getFeaturePanelWidth()).toBe(650);
    expect(
      document.documentElement.style.getPropertyValue('--feature-panel-width'),
    ).toBe('650px');
  });

  it('stores the dragged width, also the minimum', () => {
    render(<FeaturePanelWidthSync />);

    act(() => saveFeaturePanelWidth(FEATURE_PANEL_MIN_WIDTH));

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(
      String(FEATURE_PANEL_MIN_WIDTH),
    );
    expect(getFeaturePanelWidth()).toBe(FEATURE_PANEL_MIN_WIDTH);
  });

  it('keeps the stored width within the limits', () => {
    window.localStorage.setItem(STORAGE_KEY, '100');
    render(<FeaturePanelWidthSync />);

    expect(getFeaturePanelWidth()).toBe(FEATURE_PANEL_MIN_WIDTH);
  });
});
