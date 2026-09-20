import { buildStaticSitemap } from '../renderSitemap';

describe('buildStaticSitemap', () => {
  it('includes climbing list pages for search engines', () => {
    const xml = buildStaticSitemap('https://openclimbing.org');
    expect(xml).toContain('<loc>https://openclimbing.org/climbing-areas</loc>');
    expect(xml).toContain('<loc>https://openclimbing.org/via-ferratas</loc>');
    expect(xml).toContain('<loc>https://openclimbing.org/climbing-gyms</loc>');
  });
});
