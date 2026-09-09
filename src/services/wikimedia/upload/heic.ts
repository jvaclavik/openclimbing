export const isHeicFile = (file: File): boolean => {
  const type = file.type.toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext === 'heic' || ext === 'heif';
};

export const convertHeicToJpeg = async (file: File): Promise<File> => {
  // heic-to bundles an up-to-date libheif and decodes real iPhone HEIC/HEIF
  // photos in desktop browsers (unlike the abandoned heic2any). Load it on
  // demand so the decoder stays out of the shared bundle.
  const { heicTo } = await import('heic-to');
  let blob: Blob;
  try {
    blob = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality: 0.92,
    });
  } catch (e) {
    // heic-to (and its worker) may reject with non-Error values; surface a
    // clear message instead of the generic "Failed to prepare file for upload".
    const reason = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not convert HEIC image to JPG: ${reason}`);
  }
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([blob], newName, {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  });
};
