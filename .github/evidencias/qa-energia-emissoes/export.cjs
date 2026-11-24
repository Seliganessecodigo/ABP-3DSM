const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const backend = JSON.parse(fs.readFileSync(path.join(root, 'backend/qa-energy-results.json'), 'utf8'));
fs.writeFileSync(path.join(__dirname, 'backend-results.json'), JSON.stringify({ productionSha: 'f282e3cfa9dd75dee04756215dee8607480a576f', at: new Date(backend.startTime).toISOString(), passed: backend.numPassedTests, failed: backend.numFailedTests, skipped: backend.numPendingTests, assertions: backend.testResults.flatMap(suite => suite.assertionResults.map(({ fullName, status, duration, failureMessages }) => ({ fullName, status, duration, failureMessages }))) }, null, 2));
const web = JSON.parse(fs.readFileSync(path.join(root, 'frontend/test-results/qa-energy.json'), 'utf8'));
const tests = [];
for (const suite of web.suites) for (const spec of suite.specs) for (const test of spec.tests) {
  const result = test.results[0];
  const width = spec.title.match(/(\d+)px/)[1];
  tests.push({ title: spec.title, status: result.status, durationMs: result.duration, errors: result.errors });
  const video = result.attachments.find(attachment => attachment.contentType === 'video/webm');
  if (video) {
    fs.copyFileSync(video.path, path.join(__dirname, `ct023-024-${width}.webm`));
    for (const file of fs.readdirSync(path.dirname(video.path)).filter(file => file.startsWith('ct0') && file.endsWith('.png'))) fs.copyFileSync(path.join(path.dirname(video.path), file), path.join(__dirname, file));
  }
}
fs.writeFileSync(path.join(__dirname, 'browser-results.json'), JSON.stringify({ productionSha: 'f282e3cfa9dd75dee04756215dee8607480a576f', browser: 'Chromium 156.0.8078.4 / Playwright 1.64.0', at: web.stats.startTime, tests }, null, 2));
console.log(JSON.stringify({ backendPassed: backend.numPassedTests, ui: tests.map(({ title, status }) => ({ title, status })) }));
