import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = async (name) => JSON.parse(await readFile(path.join(root, name), 'utf8'));
const dataset = await readJson('public/data/evaluations.json');
const ledger = await readJson(`${dataset.run.recordDirectory}/ledger.json`);
const records = await Promise.all(ledger.entries.map(async (entry) => ({
  path: entry.recordPath,
  record: await readJson(entry.recordPath),
})));
const evidence = {
  schemaVersion: 1,
  description: 'Reproducible public evaluation evidence. Sanitized API records omit credentials and private reasoning. Hashes establish file consistency, not independent attestation.',
  dataset,
  ledger,
  modelCatalog: await readJson(`${dataset.run.recordDirectory}/models-snapshot.json`),
  records,
  equipment: await readJson('public/data/equipment.json'),
  assets: await readJson('public/data/assets.json'),
  methodology: await readFile(path.join(root, 'docs/BENCHMARK.md'), 'utf8'),
  collectorSource: await readFile(path.join(root, 'scripts/benchmark.py'), 'utf8'),
  verifierSource: await readFile(path.join(root, 'scripts/verify_data.py'), 'utf8'),
};
await writeFile(path.join(root, 'public/data/evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(`Packaged public evidence for ${records.length} model attempts.`);
