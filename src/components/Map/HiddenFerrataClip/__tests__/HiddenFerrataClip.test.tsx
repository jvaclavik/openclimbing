import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import type { View } from '../../../utils/MapStateContext';
import { HiddenFerrataClip } from '../HiddenFerrataClip';

const riva: View = ['16', '45.8848', '10.8397'];
const nearRiva: View = ['16', '45.885', '10.840'];
const outside: View = ['13', '45.8848', '10.8397'];
const mezzocorona: View = ['16', '46.2304', '11.0988'];
let mockView = riva;

jest.mock('../../../utils/MapStateContext', () => ({
  useMapStateContext: () => ({ view: mockView }),
}));

describe('HiddenFerrataClip', () => {
  beforeEach(() => {
    mockView = riva;
    jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    jest
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('plays a clip twice per visit and cycles clips when returning', () => {
    const { container, rerender } = render(<HiddenFerrataClip />);
    const video = () => container.querySelector('video');
    const firstVideo = video()!;
    expect(firstVideo.getAttribute('src')).toBe('/versteckt/rivadelgarda.mp4');

    mockView = nearRiva;
    rerender(<HiddenFerrataClip />);
    expect(video()).toBe(firstVideo);

    fireEvent.ended(firstVideo);
    expect(video()).toBe(firstVideo);
    fireEvent.ended(firstVideo);
    expect(video()).toBeNull();

    mockView = outside;
    rerender(<HiddenFerrataClip />);
    mockView = riva;
    rerender(<HiddenFerrataClip />);
    expect(video()?.getAttribute('src')).toBe('/versteckt/szene-33.mp4');

    mockView = outside;
    rerender(<HiddenFerrataClip />);
    mockView = riva;
    rerender(<HiddenFerrataClip />);
    expect(video()?.getAttribute('src')).toBe('/versteckt/rivadelgarda.mp4');
  });

  it('reopens a dismissed spot after visiting another spot', () => {
    const { container, getByRole, rerender } = render(<HiddenFerrataClip />);
    fireEvent.click(getByRole('button', { name: 'close' }));
    expect(container.querySelector('video')).toBeNull();

    mockView = mezzocorona;
    rerender(<HiddenFerrataClip />);
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      '/versteckt/mezzocorona.mp4',
    );

    mockView = riva;
    rerender(<HiddenFerrataClip />);
    expect(container.querySelector('video')?.getAttribute('src')).toBe(
      '/versteckt/szene-33.mp4',
    );
  });
});
