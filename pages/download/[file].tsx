import type { GetServerSideProps } from 'next';
import { createReadStream, statSync } from 'fs';
import { getExportFilePath } from '../../src/server/climbing-tiles/exportDatabase';

const CACHE_MAX_AGE_SECONDS = 5 * 60; // matches the export regeneration interval

const Download = () => null;

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const raw = query.file;
  const fileName = Array.isArray(raw) ? raw[0] : raw;

  const filePath = fileName ? getExportFilePath(fileName) : null;
  if (!filePath) {
    res.statusCode = 404;
    res.end('Not found');
    return { props: {} };
  }

  const stat = statSync(filePath);

  res.setHeader('Content-Type', 'application/vnd.sqlite3');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Last-Modified', stat.mtime.toUTCString());
  res.setHeader(
    'Expires',
    new Date(Date.now() + CACHE_MAX_AGE_SECONDS * 1000).toUTCString(),
  );
  res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}`);

  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on('error', reject);
    res.on('finish', resolve);
    res.on('error', reject);
    stream.pipe(res);
  });

  return { props: {} };
};

export default Download;
