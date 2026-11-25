const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const base = 'https://app-greener-api-staging-brs-ecxiqsrl.azurewebsites.net';
  const results = [];
  for (const route of ['/applications']) {
    try {
      const response = await fetch(base + route, { signal: AbortSignal.timeout(30000) });
      const body = await response.json();
      results.push({ route, status: response.status, applicationCount: Array.isArray(body) ? body.length : null });
    } catch (error) { results.push({ route, error: String(error) }); }
  }
  fs.writeFileSync(path.join(__dirname, 'staging.json'), JSON.stringify({ at: new Date().toISOString(), base, results, scope: 'Somente leitura do catálogo; fontes não alteradas. Cenários determinísticos executados localmente.' }, null, 2));
  console.log(JSON.stringify(results));
})().catch(error => { console.error(error); process.exitCode = 1 });
