// Sizzle & Serve hand-in (Node 22, standard library only).
// Copies the static game and the screenshots beside this file into the
// output directory and writes dossier.json with the kit's vendored library.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// Fail loudly instead of handing in a half-written output: the grader runs
// this program twice and both runs must produce the same complete output.
for (const required of [join(outputDir, 'game', 'index.html'), dossierPath]) {
  if (!existsSync(required)) throw new Error(`hand-in incomplete: missing ${required}`);
}
const shotCount = readdirSync(join(outputDir, 'screenshots')).filter((f) => !f.startsWith('.')).length;
if (shotCount < 3 || shotCount > 4) throw new Error(`hand-in incomplete: ${shotCount} screenshots, need 3 or 4`);
console.log(`Sizzle & Serve hand-in written to ${outputDir} (${shotCount} screenshots, dossier ${statSync(dossierPath).size} bytes).`);
