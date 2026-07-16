import type { GetServerSideProps } from 'next';
import { PROJECT_URL, setProjectForSSR } from '../src/services/project';

const Robots = () => null;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  setProjectForSSR(req);

  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${PROJECT_URL}/sitemap.xml`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  // cached at the edge so this serverless route rarely executes (perf on Vercel)
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=86400, stale-while-revalidate=43200',
  );
  res.write(body);
  res.end();

  return { props: {} };
};

export default Robots;
