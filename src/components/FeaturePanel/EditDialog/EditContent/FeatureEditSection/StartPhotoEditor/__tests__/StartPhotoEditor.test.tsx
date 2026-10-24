import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StartPhotoEditor } from '../StartPhotoEditor';
import {
  useCurrentItem,
  useEditContext,
} from '../../../../context/EditContext';
import { useEnsureEditItems } from '../../../../context/useEnsureEditItems';
import { useOptionalEditDialogUploadContext } from '../../../../EditDialogUploadContext';
import { START_PHOTO_KEY } from '../../../../../Climbing/utils/photo';

jest.mock('../../../../context/EditContext', () => ({
  useCurrentItem: jest.fn(),
  useEditContext: jest.fn(),
}));
jest.mock('../../../../context/useEnsureEditItems', () => ({
  useEnsureEditItems: jest.fn(),
}));
jest.mock('../../../../EditDialogUploadContext', () => ({
  useOptionalEditDialogUploadContext: jest.fn(),
}));
jest.mock('../../WikimediaCommonsGalleryRow', () => ({
  WikimediaCommonsGalleryRow: ({ label, value }) => (
    <div data-testid="row">{`${label}=${value}`}</div>
  ),
}));

const routeTags = (name: string, startPhoto?: string) => ({
  climbing: 'route_bottom',
  name,
  ...(startPhoto ? { [START_PHOTO_KEY]: startPhoto } : {}),
});

const crag = {
  shortId: 'r1',
  tags: { climbing: 'crag', name: 'Crag' },
  members: [
    { shortId: 'n1', role: '', originalTags: routeTags('One', 'File:1.jpg') },
    { shortId: 'n2', role: '', originalTags: routeTags('Two') },
    { shortId: 'n3', role: '', originalTags: routeTags('Three') },
  ],
};

const setup = (current, items, startPhotoRequested = false) => {
  const upload = {
    openUpload: jest.fn(),
    consumeStartPhotoRequest: jest.fn(() => startPhotoRequested),
  };
  const edit = { items, setCurrent: jest.fn(), setSelectedIds: jest.fn() };
  const ensureItems = jest.fn(() => Promise.resolve());
  (useCurrentItem as jest.Mock).mockReturnValue({
    setTag: jest.fn(),
    setTagsEntries: jest.fn(),
    ...current,
  });
  (useEditContext as jest.Mock).mockReturnValue(edit);
  (useEnsureEditItems as jest.Mock).mockReturnValue(ensureItems);
  (useOptionalEditDialogUploadContext as jest.Mock).mockReturnValue(upload);
  return { upload, edit, ensureItems };
};

describe('StartPhotoEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the start photo of a route', () => {
    const route = { shortId: 'n1', tags: routeTags('One', 'File:1.jpg') };
    setup(route, [route]);
    render(<StartPhotoEditor />);

    expect(screen.getByTestId('row').textContent).toBe(
      'start_photo.label=File:1.jpg',
    );
  });

  it('opens the upload when the dialog was opened by "Add start photo"', () => {
    const route = { shortId: 'n2', tags: routeTags('Two') };
    const { upload } = setup(route, [route], true);
    render(<StartPhotoEditor />);

    expect(upload.openUpload).toHaveBeenCalledWith({
      targetSlotKey: START_PHOTO_KEY,
    });
  });

  it('leads to the next route of the crag without a start photo', async () => {
    const route = { shortId: 'n2', tags: routeTags('Two', 'File:2.jpg') };
    const { upload, edit, ensureItems } = setup(route, [crag, route]);
    render(<StartPhotoEditor />);

    expect(upload.openUpload).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByText('start_photo.next_route'));
    });

    expect(ensureItems).toHaveBeenCalledWith(['n3']);
    expect(edit.setCurrent).toHaveBeenCalledWith('n3');
    expect(upload.openUpload).toHaveBeenCalledWith({
      targetSlotKey: START_PHOTO_KEY,
    });
  });

  it('starts the walk along the crag right away when requested', async () => {
    const { edit } = setup(crag, [crag], true);
    await act(async () => {
      render(<StartPhotoEditor />);
    });

    expect(screen.getByText('start_photo.crag_progress')).toBeTruthy();
    expect(edit.setCurrent).toHaveBeenCalledWith('n2');
  });

  it('shows nothing for other features', () => {
    setup({ shortId: 'n9', tags: { natural: 'peak' } }, []);
    const { container } = render(<StartPhotoEditor />);
    expect(container.innerHTML).toBe('');
  });
});
