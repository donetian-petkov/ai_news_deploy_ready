#!/usr/bin/env node
const { spawn } = require('node:child_process');

const rootDir = require('node:path').resolve(__dirname, '..');
const children = new Map();
let shuttingDown = false;

const services = [
  { name: 'api', args: ['run', 'start', '-w', '@ai-news/api'] },
  { name: 'web', args: ['run', 'start', '-w', '@ai-news/web'] }
];

function startService(service, attempt = 0) {
  if (shuttingDown) return;
  const child = spawn('npm', service.args, {
    cwd: rootDir,
    env: process.env,
    stdio: 'inherit',
    // npm is npm.cmd on Windows, which only starts through a shell.
    shell: process.platform === 'win32'
  });
  children.set(service.name, child);
  child.on('exit', (code, signal) => {
    children.delete(service.name);
    if (shuttingDown) return;
    const delayMs = Math.min(30_000, 2_000 + attempt * 3_000);
    console.error(`[stack] ${service.name} exited (${signal || (code ?? 0)}); restarting in ${Math.round(delayMs / 1000)}s`);
    setTimeout(() => startService(service, attempt + 1), delayMs).unref?.();
  });
}

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[stack] shutting down (${signal})`);
  for (const child of children.values()) {
    try {
      child.kill('SIGTERM');
    } catch {}
  }
  setTimeout(() => process.exit(0), 1500).unref?.();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

services.forEach(service => startService(service));
