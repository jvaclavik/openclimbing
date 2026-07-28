// @ts-check
import { withSentryConfig } from '@sentry/nextjs';
import bundleAnalyzer from '@next/bundle-analyzer';
import { LANGUAGES } from './src/config.mjs';

// Run `yarn analyze` to build with the interactive treemap of client/server
// bundles (opens in the browser). No effect on normal `yarn build`.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const osmappVersion = process.env.npm_package_version;
const commitHash = (process.env.VERCEL_GIT_COMMIT_SHA || '').substring(0, 7);
const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || 'dev';
const sentryRelease = `${osmappVersion}-${commitHash}-${commitMessage.substring(0, 20)}`;
const isVpsDeploy = !!process.env.VPS_DEPLOY; // set only in vps-deploy.yml, so PR/preview builds stay fast

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: { position: 'bottom-right' },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  compiler: {
    emotion: true,
  },
  output: process.env.NEXTJS_OUTPUT || undefined,
  env: { osmappVersion, sentryRelease },
  experimental: {
    // Rewrite barrel imports (`import { Button } from '@mui/material'`) to
    // direct submodule imports so only used components are bundled.
    optimizePackageImports: [
      '@mui/material',
      '@mui/lab',
      '@mui/icons-material',
      '@mui/system',
    ],
  },
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

export default withBundleAnalyzer(
  withSentryConfig(nextConfig, {
    org: 'osmapp', // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    project: 'osmapp',
    silent: !process.env.CI,
    widenClientFileUpload: isVpsDeploy, // full source maps only for the production VPS build
    reactComponentAnnotation: { enabled: isVpsDeploy }, // component-name annotations bloat runtime bundle, keep off elsewhere
    // tunnelRoute: '/monitoring',
    hideSourceMaps: false,
    disableLogger: true, // Automatically tree-shake Sentry logger statements to reduce bundle size
    automaticVercelMonitors: true, // https://vercel.com/docs/cron-jobs
  }),
);
