/* eslint-disable import/no-mutable-exports */
import { IncomingMessage } from 'node:http';
import { isBrowser } from '../components/helpers';
import { publishDbgObject } from '../utils';
import type { TranslationId } from './types';

type Project = {
  id: string;
  name: string;
  url: string;
  ogImage: string;
  description: TranslationId;
  serpDescription: TranslationId;
};

const osmapp: Project = {
  id: 'osmapp',
  name: 'OsmAPP',
  url: 'https://osmapp.org',
  ogImage: 'https://osmapp.org/screens/karlstejn2.png',
  description: 'project.osmapp.description',
  serpDescription: 'project.osmapp.serpDescription',
};

const openclimbing: Project = {
  id: 'openclimbing',
  name: 'Klettersteig-Karte',
  url: 'https://openclimbing.org',
  ogImage: 'https://openclimbing.org/openclimbing/homepage.png',
  description: 'project.openclimbing.description',
  serpDescription: 'project.openclimbing.serpDescription',
};

const domains: Record<string, Project> = {
  'osmapp.org': osmapp,
  'openclimbing.org': openclimbing,
  '127.0.0.1:3000': openclimbing,
  'localhost:3000': openclimbing,
};

// This fork is the via ferrata app: any other host (own domain, *.vercel.app
// previews, other ports) keeps its branding and links back to itself.
const openclimbingOnHost = (host: string | undefined): Project => {
  if (!host) return openclimbing;
  const isLocal = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  return { ...openclimbing, url: `${isLocal ? 'http' : 'https'}://${host}` };
};

const forceProjectHost = process.env.NEXT_PUBLIC_FORCE_PROJECT;
const forcedProject = forceProjectHost ? domains[forceProjectHost] : undefined;

// Globals
export let PROJECT_ID = 'error: PROJECT not set';
export let PROJECT_NAME = 'error: PROJECT not set';
export let PROJECT_URL = 'error: PROJECT not set';
export let PROJECT_OG_IMAGE = 'error: PROJECT not set';
export let PROJECT_DECRIPTION = 'error: PROJECT not set' as TranslationId;
export let PROJECT_SERP_DESCRIPTION = 'error: PROJECT not set' as TranslationId;

const setProject = (host: string) => {
  const project = forcedProject ?? domains[host] ?? openclimbingOnHost(host);
  PROJECT_ID = project.id;
  PROJECT_NAME = project.name;
  PROJECT_URL = project.url;
  PROJECT_OG_IMAGE = project.ogImage;
  PROJECT_DECRIPTION = project.description;
  PROJECT_SERP_DESCRIPTION = project.serpDescription;

  publishDbgObject('project', project);
};

// server - runs in document getInitialProps()
export const setProjectForSSR = (req: IncomingMessage) => {
  const { host } = req.headers;
  setProject(host);
};

// browser - runs here
if (isBrowser()) {
  const { host } = window.location;
  setProject(host);
}
