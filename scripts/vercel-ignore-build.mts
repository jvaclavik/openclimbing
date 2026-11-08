import { execFileSync } from 'node:child_process';
import { shouldSkipVercelBuild } from '../src/server/deploy/vercelIgnore.ts';

const previousSha = process.env.VERCEL_GIT_PREVIOUS_SHA;

const readChangedPaths = () => {
  if (!previousSha) return null;
  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-only', previousSha, 'HEAD'],
      { encoding: 'utf8' },
    );
    return output.split('\n').filter((line) => line.length > 0);
  } catch {
    return null;
  }
};

const skip = shouldSkipVercelBuild({
  vercelEnv: process.env.VERCEL_ENV,
  previousSha,
  changedPaths: readChangedPaths(),
});

if (skip) {
  console.log(
    'Vercel-Build übersprungen: seit dem letzten Deployment hat sich keine App-Datei geändert.',
  );
  process.exit(0);
}

console.log('Vercel-Build wird ausgeführt.');
process.exit(1);
