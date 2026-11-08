import { shouldSkipVercelBuild } from '../vercelIgnore';

const preview = {
  vercelEnv: 'preview',
  previousSha: 'abc123',
};

test('baut Produktion immer', () => {
  expect(
    shouldSkipVercelBuild({
      vercelEnv: 'production',
      previousSha: 'abc123',
      changedPaths: ['AGENTS.md'],
    }),
  ).toBe(false);
});

test('baut, wenn der Vergleichsstand fehlt oder nicht lesbar ist', () => {
  expect(
    shouldSkipVercelBuild({
      ...preview,
      previousSha: undefined,
      changedPaths: ['AGENTS.md'],
    }),
  ).toBe(false);
  expect(
    shouldSkipVercelBuild({
      ...preview,
      changedPaths: null,
    }),
  ).toBe(false);
});

test('überspringt Vorschauen ohne App-Änderung', () => {
  expect(
    shouldSkipVercelBuild({
      ...preview,
      changedPaths: [
        'AGENTS.md',
        'README.md',
        'docs/kletterglueck/tourenchat.md',
        '.github/workflows/node.js.yml',
        'experiments/note.txt',
        'video-schnipsel/clip.mp4',
        '.cursor/environment.json',
        'LICENSE.txt',
      ],
    }),
  ).toBe(true);
  expect(
    shouldSkipVercelBuild({
      ...preview,
      changedPaths: [],
    }),
  ).toBe(true);
});

test('baut, sobald Anwendungscode dabei ist', () => {
  expect(
    shouldSkipVercelBuild({
      ...preview,
      changedPaths: ['AGENTS.md', 'next.config.mjs'],
    }),
  ).toBe(false);
  expect(
    shouldSkipVercelBuild({
      ...preview,
      changedPaths: ['package.json'],
    }),
  ).toBe(false);
});
