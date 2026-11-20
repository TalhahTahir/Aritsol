// `npm run dev`: starts the API (port 3001) and the Vite dev server (port 5173) together.
// Stop both with Ctrl+C.
import { spawn } from 'node:child_process';
import path from 'node:path';

const node = process.execPath;
const run = (name, args) => {
  const child = spawn(node, args, { stdio: 'inherit', env: process.env });
  child.on('exit', (code) => {
    if (code && code !== 0) console.log(`[${name}] stopped with code ${code}`);
    shutdown();
  });
  return child;
};

const children = [
  run('api', ['--watch', 'server/dev.js']),
  run('web', [path.join('node_modules', 'vite', 'bin', 'vite.js')]),
];

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  children.forEach((c) => c.exitCode === null && c.kill());
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
