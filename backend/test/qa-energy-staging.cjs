const fs = require('node:fs');
const path = require('node:path');
const base = 'https://app-greener-api-staging-brs-ecxiqsrl.azurewebsites.net';
const results = [];
async function get(route) {
  const start = performance.now();
  const entry = { route };
  results.push(entry);
  try {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(15000) });
    entry.status = response.status;
    entry.body = await response.json();
    return entry;
  } catch (error) { entry.error = error.name; return entry; }
  finally { entry.durationMs = Math.round(performance.now() - start); }
}
(async () => {
  const apps = await get('/applications');
  const first = Array.isArray(apps.body) ? apps.body[0] : undefined;
  apps.body = { count: Array.isArray(apps.body) ? apps.body.length : null, firstId: first?.id };
  if (first) await get(`/applications/${encodeURIComponent(first.id)}/collections/latest`);
  const directory = path.resolve(__dirname, '../../.github/evidencias/qa-energia-emissoes');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'staging.json'), JSON.stringify({ at: new Date().toISOString(), base, results }, null, 2));
  console.log(JSON.stringify(results.map(({ route, status, durationMs, error }) => ({ route, status, durationMs, error }))));
})().catch(error => { console.error(error); process.exitCode = 1; });
