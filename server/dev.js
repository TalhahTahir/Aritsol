// Local API server for development (`npm run dev` starts it together with Vite).
// Reads settings from .env in the project root, then serves the API on port 3001.
import fs from 'node:fs';

import dns from 'node:dns';

// Some home/ISP DNS servers refuse the lookup that mongodb+srv:// needs (querySrv ECONNREFUSED).
// Use public DNS for this local server only. (Vercel does not need this.)
dns.setServers(['8.8.8.8', '1.1.1.1']);

for (const file of ['.env', '.env.local']) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trim().startsWith('#')) continue;
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    let value = m[2];
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}

const { default: app } = await import('./app.js');
const { configSummary } = await import('./config/env.js');
const port = Number(process.env.API_PORT) || 3001;

app.listen(port, () => {
  console.log(`ARTISOL API on http://localhost:${port}/api`);
  for (const [k, v] of Object.entries(configSummary())) console.log(`  ${k.padEnd(10)} ${v}`);
});
