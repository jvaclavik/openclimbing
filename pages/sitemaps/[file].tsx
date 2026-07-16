import type { GetServerSideProps } from 'next';
import { PROJECT_URL, setProjectForSSR } from '../../src/services/project';

const SitemapFile = () => null;

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  params,
}) => {
  setProjectForSSR(req);
  const { buildStaticSitemap, buildFeatureSitemap } = await import(
    '../../src/server/sitemap/renderSitemap'
  );

  const file = String(params?.file ?? '');
  const featuresMatch = file.match(/^features-(\d+)\.xml$/);

  let xml: string | null = null;
  if (file === 'static.xml') {
    xml = buildStaticSitemap(PROJECT_URL);
  } else if (featuresMatch) {
    xml = buildFeatureSitemap(PROJECT_URL, parseInt(featuresMatch[1], 10));
  }

  if (xml === null) {
    res.statusCode = 404;
    res.end();
    return { props: {} };
  }

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=43200',
  );
  res.write(xml);
  res.end();

  return { props: {} };
};

export default SitemapFile;
