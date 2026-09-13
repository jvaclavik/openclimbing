import { act, renderHook, waitFor } from '@testing-library/react';
import { useUploadDialogState } from '../useUploadDialogState';
import { Feature } from '../../../../../../../services/types';
import {
  preparePhotoForUpload,
  uploadPhotoToCommons,
} from '../../../../../../../services/wikimedia/upload/uploadPhoto';
import { suggestCommonsCategories } from '../../../../../../../services/wikimedia/upload/category';
import { useWikimediaCommonsAuthContext } from '../../../../../../utils/WikimediaCommonsAuthContext';

jest.mock('../../../../../../../services/wikimedia/upload/uploadPhoto', () => ({
  preparePhotoForUpload: jest.fn(),
  uploadPhotoToCommons: jest.fn(),
}));

jest.mock('../../../../../../../services/wikimedia/upload/category', () => ({
  suggestCommonsCategories: jest.fn(),
}));

jest.mock('../../../../../../utils/WikimediaCommonsAuthContext', () => ({
  useWikimediaCommonsAuthContext: jest.fn(),
}));

const preparePhotoForUploadMock = preparePhotoForUpload as jest.Mock;
const uploadPhotoToCommonsMock = uploadPhotoToCommons as jest.Mock;
const suggestCommonsCategoriesMock = suggestCommonsCategories as jest.Mock;
const useAuthMock = useWikimediaCommonsAuthContext as jest.Mock;

const feature = {
  osmMeta: { type: 'node', id: 1 },
  tags: {},
  center: [14, 50],
} as unknown as Feature;

const imageFile = (name: string) =>
  new File(['x'], name, { type: 'image/jpeg' });

const renderState = (initialFiles: File[] | null = null) => {
  const onUploaded = jest.fn();
  const utils = renderHook(() =>
    useUploadDialogState({ open: true, feature, onUploaded, initialFiles }),
  );
  return { ...utils, onUploaded };
};

beforeAll(() => {
  // jsdom doesn't implement object URLs
  (URL as any).createObjectURL = jest.fn(() => 'blob:mock');
  (URL as any).revokeObjectURL = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  suggestCommonsCategoriesMock.mockResolvedValue([]);
  preparePhotoForUploadMock.mockImplementation(async (file: File) => ({
    file,
    exifDate: null,
    exifLocation: null,
    filenameParts: { stem: file.name.replace(/\.[^.]+$/, ''), ext: 'jpg' },
  }));
  let uploadCount = 0;
  uploadPhotoToCommonsMock.mockImplementation(async () => {
    uploadCount += 1;
    return { fileTagValue: `File:mock ${uploadCount}.jpg` };
  });
  useAuthMock.mockReturnValue({
    user: { username: 'Tester' },
    loading: false,
    handleLogin: jest.fn(),
  });
});

describe('useUploadDialogState multi-file batches', () => {
  it('uploads a single chosen file and finishes at success', async () => {
    const { result, onUploaded } = renderState();

    await act(async () => {
      await result.current.handleFilesChosen([imageFile('solo.jpg')]);
    });

    expect(result.current.stage).toBe('review');
    expect(result.current.batchTotal).toBe(1);
    expect(result.current.batchPosition).toBe(1);

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.stage).toBe('success');
    expect(uploadPhotoToCommonsMock).toHaveBeenCalledTimes(1);
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(onUploaded).toHaveBeenCalledWith('File:mock 1.jpg');
  });

  it('reviews and uploads each file of a batch sequentially', async () => {
    const { result, onUploaded } = renderState();
    const files = [imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg')];

    await act(async () => {
      await result.current.handleFilesChosen(files);
    });

    // First photo ready for review.
    expect(result.current.stage).toBe('review');
    expect(result.current.batchTotal).toBe(3);
    expect(result.current.batchPosition).toBe(1);

    // Upload #1 -> advance to the second photo's review.
    await act(async () => {
      await result.current.handleUpload();
    });
    expect(result.current.stage).toBe('review');
    expect(result.current.batchPosition).toBe(2);

    // Upload #2 -> advance to the third photo's review.
    await act(async () => {
      await result.current.handleUpload();
    });
    expect(result.current.stage).toBe('review');
    expect(result.current.batchPosition).toBe(3);

    // Upload #3 -> finished.
    await act(async () => {
      await result.current.handleUpload();
    });
    expect(result.current.stage).toBe('success');

    expect(uploadPhotoToCommonsMock).toHaveBeenCalledTimes(3);
    expect(onUploaded).toHaveBeenCalledTimes(3);
    expect(onUploaded.mock.calls.map((c) => c[0])).toEqual([
      'File:mock 1.jpg',
      'File:mock 2.jpg',
      'File:mock 3.jpg',
    ]);
  });

  it('starts a batch automatically from initialFiles (e.g. drag & drop)', async () => {
    const files = [imageFile('drop1.jpg'), imageFile('drop2.jpg')];
    const { result } = renderState(files);

    await waitFor(() => expect(result.current.stage).toBe('review'));
    expect(result.current.batchTotal).toBe(2);
    expect(result.current.batchPosition).toBe(1);
  });

  it('keeps the current file for retry when an upload fails', async () => {
    const { result, onUploaded } = renderState();
    uploadPhotoToCommonsMock.mockRejectedValueOnce(new Error('network down'));

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('x.jpg'),
        imageFile('y.jpg'),
      ]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    // Still on the first photo, with an error, nothing uploaded yet.
    expect(result.current.stage).toBe('review');
    expect(result.current.batchPosition).toBe(1);
    expect(result.current.errorMessage).toBe('network down');
    expect(onUploaded).not.toHaveBeenCalled();

    // Retrying succeeds and advances to the second photo.
    await act(async () => {
      await result.current.handleUpload();
    });
    expect(result.current.stage).toBe('review');
    expect(result.current.batchPosition).toBe(2);
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });

  it('skips a file that fails to prepare and continues the batch', async () => {
    const { result } = renderState();
    preparePhotoForUploadMock.mockRejectedValueOnce(new Error('corrupt image'));

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('bad.jpg'),
        imageFile('good.jpg'),
      ]);
    });

    // First file failed to prepare, so we move on to the second one.
    expect(result.current.stage).toBe('review');
    expect(result.current.batchTotal).toBe(2);
    expect(result.current.batchPosition).toBe(2);
    expect(preparePhotoForUploadMock).toHaveBeenCalledTimes(2);
  });

  it('reports only successfully uploaded photos in a mixed batch', async () => {
    const { result, onUploaded } = renderState();
    preparePhotoForUploadMock.mockRejectedValueOnce(new Error('corrupt image'));

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('bad.jpg'),
        imageFile('good.jpg'),
      ]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.stage).toBe('success');
    expect(result.current.batchTotal).toBe(2);
    expect(result.current.successfulUploads).toBe(1);
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });

  it('does not resurrect a file whose preparation finishes after the dialog closed', async () => {
    let resolvePrepare: (value: unknown) => void = () => {};
    preparePhotoForUploadMock.mockImplementationOnce(
      (file: File) =>
        new Promise((resolve) => {
          resolvePrepare = () =>
            resolve({
              file,
              exifDate: null,
              exifLocation: null,
              filenameParts: { stem: 'late', ext: 'jpg' },
            });
        }),
    );

    const onUploaded = jest.fn();
    const { result, rerender } = renderHook(
      ({ open }) =>
        useUploadDialogState({ open, feature, onUploaded, initialFiles: null }),
      { initialProps: { open: true } },
    );

    act(() => {
      result.current.handleFilesChosen([imageFile('late.jpg')]);
    });
    expect(result.current.stage).toBe('preparing');

    // Close the dialog while it is still preparing, then let prepare resolve.
    rerender({ open: false });
    await act(async () => {
      resolvePrepare(undefined);
      await new Promise((r) => setTimeout(r, 0));
    });

    // The stale preparation must not push the form back into the review stage.
    expect(result.current.stage).toBe('choose-file');
    expect(result.current.prepared).toBeNull();
  });

  it('invalidates generation when unmounted during preparation', async () => {
    let resolvePrepare: (value: unknown) => void = () => {};
    preparePhotoForUploadMock.mockImplementationOnce(
      (file: File) =>
        new Promise((resolve) => {
          resolvePrepare = () =>
            resolve({
              file,
              exifDate: null,
              exifLocation: null,
              filenameParts: { stem: 'late', ext: 'jpg' },
            });
        }),
    );

    const onUploaded = jest.fn();
    const { result, unmount } = renderHook(() =>
      useUploadDialogState({
        open: true,
        feature,
        onUploaded,
        initialFiles: null,
      }),
    );

    act(() => {
      result.current.handleFilesChosen([imageFile('late.jpg')]);
    });
    expect(result.current.stage).toBe('preparing');

    unmount();
    await act(async () => {
      resolvePrepare(undefined);
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
