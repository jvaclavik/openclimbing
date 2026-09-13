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
});
