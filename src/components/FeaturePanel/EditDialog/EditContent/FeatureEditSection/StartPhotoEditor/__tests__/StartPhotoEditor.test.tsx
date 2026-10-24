import React from 'react';
import { render, screen } from '@testing-library/react';
import { StartPhotoEditor } from '../StartPhotoEditor';
import { useCurrentItem } from '../../../../context/EditContext';
import { useOptionalEditDialogUploadContext } from '../../../../EditDialogUploadContext';
import { START_PHOTO_KEY } from '../../../../../Climbing/utils/photo';

jest.mock('../../../../context/EditContext', () => ({
  useCurrentItem: jest.fn(),
}));
jest.mock('../../../../EditDialogUploadContext', () => ({
  useOptionalEditDialogUploadContext: jest.fn(),
}));
jest.mock('../../WikimediaCommonsGalleryRow', () => ({
  WikimediaCommonsGalleryRow: ({ label, value }) => (
    <div data-testid="row">{`${label}=${value}`}</div>
  ),
}));

const setup = (tags: Record<string, string>, startPhotoRequested = false) => {
  const upload = {
    openUpload: jest.fn(),
    consumeStartPhotoRequest: jest.fn(() => startPhotoRequested),
  };
  (useCurrentItem as jest.Mock).mockReturnValue({
    tags,
    setTag: jest.fn(),
    setTagsEntries: jest.fn(),
  });
  (useOptionalEditDialogUploadContext as jest.Mock).mockReturnValue(upload);
  return upload;
};

describe('StartPhotoEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the start photo of a route', () => {
    setup({ climbing: 'route_bottom', [START_PHOTO_KEY]: 'File:1.jpg' });
    render(<StartPhotoEditor />);

    expect(screen.getByTestId('row').textContent).toBe(
      'start_photo.label=File:1.jpg',
    );
  });

  it('opens the upload when the dialog was opened by "Add route start photo"', () => {
    const upload = setup({ climbing: 'route_bottom' }, true);
    render(<StartPhotoEditor />);

    expect(upload.openUpload).toHaveBeenCalledWith({
      targetSlotKey: START_PHOTO_KEY,
    });
  });

  it('does not open the upload otherwise', () => {
    const upload = setup({ climbing: 'route_bottom' });
    render(<StartPhotoEditor />);

    expect(upload.openUpload).not.toHaveBeenCalled();
  });

  it('shows nothing for other features', () => {
    setup({ climbing: 'crag' });
    const { container } = render(<StartPhotoEditor />);
    expect(container.innerHTML).toBe('');
  });
});
