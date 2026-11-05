import { IncomingMessage } from 'node:http';
import * as project from '../project';

const ssrFor = (host: string | undefined) =>
  project.setProjectForSSR({ headers: { host } } as IncomingMessage);

describe('setProjectForSSR', () => {
  it('keeps the via ferrata branding on a Vercel preview host', () => {
    ssrFor('kletterfroh.vercel.app');

    expect(project.PROJECT_ID).toBe('openclimbing');
    expect(project.PROJECT_NAME).toBe('Klettersteig-Karte');
    expect(project.PROJECT_URL).toBe('https://kletterfroh.vercel.app');
  });

  it('links to an own domain instead of openclimbing.org', () => {
    ssrFor('kletterfroh.de');

    expect(project.PROJECT_NAME).toBe('Klettersteig-Karte');
    expect(project.PROJECT_URL).toBe('https://kletterfroh.de');
  });

  it('uses http for local hosts on other ports', () => {
    ssrFor('localhost:3001');

    expect(project.PROJECT_ID).toBe('openclimbing');
    expect(project.PROJECT_URL).toBe('http://localhost:3001');
  });

  it('keeps the known domains unchanged', () => {
    ssrFor('openclimbing.org');
    expect(project.PROJECT_URL).toBe('https://openclimbing.org');

    ssrFor('osmapp.org');
    expect(project.PROJECT_ID).toBe('osmapp');
  });

  it('falls back to the via ferrata app without a host header', () => {
    ssrFor(undefined);

    expect(project.PROJECT_ID).toBe('openclimbing');
    expect(project.PROJECT_URL).toBe('https://openclimbing.org');
  });
});
