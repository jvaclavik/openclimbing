// @ts-check
import { withSentryConfig } from '@sentry/nextjs';
import { LANGUAGES } from './src/config.mjs';

const osmappVersion = process.env.npm_package_version;
const commitHash = (process.env.VERCEL_GIT_COMMIT_SHA || '').substring(0, 7);
const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'dev';
const sentryRelease = `${osmappVersion}-${commitHash}-${commitMessage.substring(0, 20)}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: { position: 'bottom-right' },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  compiler: {
    emotion: true,
  },
  output: process.env.NEXTJS_OUTPUT || undefined,
  env: { osmappVersion, sentryRelease },
  i18n: {
    locales: ['default', ...Object.keys(LANGUAGES)], // we let next only handle URL, but chosen locale is in getServerIntl()
    defaultLocale: 'default',
    localeDetection: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // fetchFeatureFromTiles() dynamically imports the climbing-tiles SQLite
      // code behind an isServer() guard. Webpack still emits that async chunk
      // for the browser build, so null out the node-only deps to keep it
      // compiling (the chunk is never executed client-side).
      config.resolve.alias = {
        ...config.resolve.alias,
        'better-sqlite3': false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: 'osmapp', // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  project: 'osmapp',
  silent: !process.env.CI,
  widenClientFileUpload: false, // smaller set of source maps -> faster builds, smaller Sentry storage
  reactComponentAnnotation: { enabled: false }, // component-name annotations bloat runtime bundle
  // tunnelRoute: '/monitoring',
  hideSourceMaps: false,
  disableLogger: true, // Automatically tree-shake Sentry logger statements to reduce bundle size
  automaticVercelMonitors: true, // https://vercel.com/docs/cron-jobs
});
