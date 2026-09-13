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

  it('prepares a batch for review, allows navigation, and uploads all files', async () => {
    const { result, onUploaded } = renderState();
    const files = [imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg')];

    await act(async () => {
      await result.current.handleFilesChosen(files);
    });

    expect(result.current.stage).toBe('review');
    expect(result.current.batchTotal).toBe(3);
    expect(result.current.batchPosition).toBe(1);
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.canGoNext).toBe(true);
    expect(preparePhotoForUploadMock).toHaveBeenCalledTimes(3);

    await act(async () => {
      result.current.setDescription('first description');
      result.current.handleNextPhoto();
    });
    expect(result.current.batchPosition).toBe(2);
    expect(result.current.description).toBe('');

    await act(async () => {
      result.current.setDescription('second description');
      result.current.handleNextPhoto();
    });
    expect(result.current.batchPosition).toBe(3);
    expect(result.current.canGoNext).toBe(false);

    await act(async () => {
      result.current.handlePreviousPhoto();
    });
    expect(result.current.batchPosition).toBe(2);
    expect(result.current.description).toBe('second description');

    await act(async () => {
      result.current.handlePreviousPhoto();
    });
    expect(result.current.batchPosition).toBe(1);
    expect(result.current.description).toBe('first description');

    await act(async () => {
      await result.current.handleUpload();
    });
    expect(result.current.stage).toBe('success');
    expect(result.current.successfulUploads).toBe(3);

    expect(uploadPhotoToCommonsMock).toHaveBeenCalledTimes(3);
    expect(suggestCommonsCategoriesMock).toHaveBeenCalledTimes(1);
    expect(
      uploadPhotoToCommonsMock.mock.calls.map(([args]) => args.description),
    ).toEqual(['first description', 'second description', '']);
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
    expect(preparePhotoForUploadMock).toHaveBeenCalledTimes(2);
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

    expect(result.current.stage).toBe('review');
    expect(result.current.batchPosition).toBe(1);
    expect(result.current.errorMessage).toBe('network down');
    expect(onUploaded).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.handleUpload();
    });
    expect(result.current.stage).toBe('success');
    expect(result.current.successfulUploads).toBe(2);
    expect(onUploaded).toHaveBeenCalledTimes(2);
  });

  it('resumes a retry after the successful photos instead of uploading them again', async () => {
    const { result, onUploaded } = renderState();
    uploadPhotoToCommonsMock
      .mockImplementationOnce(async () => ({ fileTagValue: 'File:first.jpg' }))
      .mockRejectedValueOnce(new Error('network down'));

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('first.jpg'),
        imageFile('second.jpg'),
      ]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.stage).toBe('review');
    expect(result.current.errorMessage).toBe('network down');
    expect(result.current.successfulUploads).toBe(1);
    expect(onUploaded).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.stage).toBe('success');
    expect(result.current.successfulUploads).toBe(2);
    expect(uploadPhotoToCommonsMock).toHaveBeenCalledTimes(3);
    expect(onUploaded).toHaveBeenCalledTimes(2);
    expect(onUploaded.mock.calls.map((c) => c[0])).toEqual([
      'File:first.jpg',
      'File:mock 1.jpg',
    ]);
  });

  it('does not allow retry navigation back into already uploaded photos', async () => {
    const { result } = renderState();
    uploadPhotoToCommonsMock
      .mockImplementationOnce(async () => ({ fileTagValue: 'File:first.jpg' }))
      .mockRejectedValueOnce(new Error('network down'));

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('first.jpg'),
        imageFile('second.jpg'),
        imageFile('third.jpg'),
      ]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.stage).toBe('review');
    expect(result.current.successfulUploads).toBe(1);
    expect(result.current.batchPosition).toBe(2);
    expect(result.current.canGoPrevious).toBe(false);
    expect(result.current.canGoNext).toBe(true);

    await act(async () => {
      result.current.handlePreviousPhoto();
    });
    expect(result.current.batchPosition).toBe(2);

    await act(async () => {
      result.current.handleNextPhoto();
    });
    expect(result.current.batchPosition).toBe(3);
    expect(result.current.canGoPrevious).toBe(true);

    await act(async () => {
      result.current.handlePreviousPhoto();
    });
    expect(result.current.batchPosition).toBe(2);
    expect(result.current.canGoPrevious).toBe(false);
  });

  it('reports the batch as invalid when any photo has an empty filename', async () => {
    const { result } = renderState();

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('first.jpg'),
        imageFile('second.jpg'),
      ]);
    });

    expect(result.current.isBatchValid).toBe(true);

    await act(async () => {
      result.current.handleNextPhoto();
    });
    await act(async () => {
      result.current.setFilenameStem('  ');
    });
    await act(async () => {
      result.current.handlePreviousPhoto();
    });

    expect(result.current.filenameStem).toBe('first');
    expect(result.current.isBatchValid).toBe(false);
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

    expect(result.current.stage).toBe('review');
    expect(result.current.batchTotal).toBe(1);
    expect(result.current.batchPosition).toBe(1);
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
    expect(result.current.batchTotal).toBe(1);
    expect(result.current.successfulUploads).toBe(1);
    expect(result.current.skippedFilesCount).toBe(1);
    expect(result.current.skippedFilesMessage).toBe('corrupt image');
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });

  it('finishes with success when the last queued file is skipped after earlier uploads', async () => {
    const { result } = renderState();
    preparePhotoForUploadMock.mockRejectedValueOnce(
      new Error('broken second file'),
    );

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('good.jpg'),
        imageFile('bad.jpg'),
      ]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.stage).toBe('success');
    expect(result.current.batchTotal).toBe(1);
    expect(result.current.successfulUploads).toBe(1);
    expect(result.current.skippedFilesCount).toBe(1);
    expect(result.current.skippedFilesMessage).toBe('broken second file');
  });

  it('preserves per-photo edits while moving between photos before upload', async () => {
    const { result } = renderState();

    await act(async () => {
      await result.current.handleFilesChosen([
        imageFile('first.jpg'),
        imageFile('second.jpg'),
      ]);
    });

    await act(async () => {
      result.current.setFilenameStem('first-custom');
      result.current.setDescription('first description');
      result.current.setCategories(['Category:First']);
      result.current.handleNextPhoto();
    });

    expect(result.current.batchPosition).toBe(2);
    expect(result.current.filenameStem).toBe('second');

    await act(async () => {
      result.current.setFilenameStem('second-custom');
      result.current.setDescription('second description');
      result.current.setCategories(['Category:Second']);
      result.current.handlePreviousPhoto();
    });

    expect(result.current.batchPosition).toBe(1);
    expect(result.current.filenameStem).toBe('first-custom');
    expect(result.current.description).toBe('first description');
    expect(result.current.categories).toEqual(['Category:First']);

    await act(async () => {
      result.current.handleNextPhoto();
    });

    expect(result.current.filenameStem).toBe('second-custom');
    expect(result.current.description).toBe('second description');
    expect(result.current.categories).toEqual(['Category:Second']);
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
    expect(URL.createObjectURL).not.toHaveBeenCalled();
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

  it('does not start an upload after login resolves for a stale dialog generation', async () => {
    let resolveLogin: (value: { username: string }) => void = () => {};
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
      handleLogin: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          }),
      ),
    });

    const onUploaded = jest.fn();
    const { result, rerender } = renderHook(
      ({ open }) =>
        useUploadDialogState({ open, feature, onUploaded, initialFiles: null }),
      { initialProps: { open: true } },
    );

    await act(async () => {
      await result.current.handleFilesChosen([imageFile('late.jpg')]);
    });

    act(() => {
      void result.current.handleUpload();
    });

    rerender({ open: false });
    await act(async () => {
      resolveLogin({ username: 'Tester' });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(uploadPhotoToCommonsMock).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('ignores stale upload progress after the dialog generation changes', async () => {
    let resolveUpload: (value: { fileTagValue: string }) => void = () => {};
    let staleProgress:
      | ((progress: { loaded: number; total: number }) => void)
      | undefined;
    uploadPhotoToCommonsMock.mockImplementationOnce(
      ({
        onProgress,
      }: {
        onProgress: (progress: { loaded: number; total: number }) => void;
      }) =>
        new Promise((resolve) => {
          staleProgress = onProgress;
          resolveUpload = resolve;
        }),
    );

    const onUploaded = jest.fn();
    const { result, rerender } = renderHook(
      ({ open }) =>
        useUploadDialogState({ open, feature, onUploaded, initialFiles: null }),
      { initialProps: { open: true } },
    );

    await act(async () => {
      await result.current.handleFilesChosen([imageFile('first.jpg')]);
    });

    act(() => {
      void result.current.handleUpload();
    });

    rerender({ open: false });
    rerender({ open: true });
    await act(async () => {
      await result.current.handleFilesChosen([imageFile('second.jpg')]);
    });

    act(() => {
      staleProgress?.({ loaded: 5, total: 10 });
    });

    expect(result.current.progress).toBeNull();

    await act(async () => {
      resolveUpload({ fileTagValue: 'File:first.jpg' });
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(onUploaded).toHaveBeenCalledWith('File:first.jpg');
  });
});
