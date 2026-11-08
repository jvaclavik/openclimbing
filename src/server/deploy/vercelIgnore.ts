const SKIP_PREFIXES = [
  'docs/',
  '.github/',
  'experiments/',
  'video-schnipsel/',
  '.cursor/',
];

export const isDocsOnlyPath = (file: string) =>
  file.endsWith('.md') ||
  file === 'LICENSE.txt' ||
  file === 'AGENTS.md' ||
  SKIP_PREFIXES.some((prefix) => file.startsWith(prefix));

export type VercelIgnoreInput = {
  vercelEnv: string | undefined;
  previousSha: string | undefined;
  changedPaths: string[] | null;
};

// true means the Vercel ignore command should exit 0 and skip the build.
export const shouldSkipVercelBuild = ({
  vercelEnv,
  previousSha,
  changedPaths,
}: VercelIgnoreInput) => {
  if (vercelEnv === 'production') return false;
  if (!previousSha || changedPaths === null) return false;
  return changedPaths.every(isDocsOnlyPath);
};
