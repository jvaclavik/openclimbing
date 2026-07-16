import type { GetServerSideProps } from 'next';
import { PROJECT_URL, setProjectForSSR } from '../src/services/project';

const SitemapIndex = () => null;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  setProjectForSSR(req);
  const { buildSitemapIndex } = await import(
    '../src/server/sitemap/renderSitemap'
  );

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=43200',
  );
  res.write(buildSitemapIndex(PROJECT_URL));
  res.end();

  return { props: {} };
};

export default SitemapIndex;
