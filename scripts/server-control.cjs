#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.resolve(process.env.AI_NEWS_DATA_DIR || path.join(rootDir, '.data'));
const pidFile = path.join(dataDir, 'server.pid');
const logFile = path.join(dataDir, 'server.log');

const rawArgs = process.argv.slice(2);
const command = rawArgs[0];
const background = rawArgs.some(arg => arg === '--background' || arg === '--detach' || arg === '-d');
const devMode = rawArgs.some(arg => arg === '--dev');
const runScript = devMode ? 'dev' : 'start';

if (command === 'status') {
  status();
} else if (command === 'stop') {
  stop();
} else if (background) {
  startBackground();
} else {
  startForeground();
}

function startForeground() {
  const child = spawn('npm', ['run', runScript], {
    cwd: rootDir,
    env: process.env,
    stdio: 'inherit'
  });
  child.on('exit', code => process.exit(code || 0));
}

function startBackground() {
  const existing = runningPid();
  if (existing) {
    console.log(`Server already running in background (pid ${existing}). Stop it with \`npm run stop\`.`);
    return;
  }

  fs.mkdirSync(dataDir, { recursive: true });
  const out = fs.openSync(logFile, 'a');
  const child = spawn('npm', ['run', runScript], {
    cwd: rootDir,
    env: process.env,
    detached: true,
    stdio: ['ignore', out, out]
  });
  fs.writeFileSync(pidFile, `${child.pid}\n`);
  child.unref();

  console.log(`Server started in background (pid ${child.pid})`);
  console.log(`Mode: ${runScript}`);
  console.log(`Logs: ${logFile}`);
  console.log('Stop with: npm run stop');
}

function stop() {
  const pid = readPid();
  if (!pid) {
    console.log('No background server is running.');
    return;
  }
  if (!isAlive(pid)) {
    console.log(`No process found for pid ${pid}; clearing stale pidfile.`);
    clearPidFile();
    return;
  }
  try {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      process.kill(pid, 'SIGTERM');
    }
    console.log(`Stopped background server (pid ${pid})`);
    clearPidFile();
  } catch (error) {
    console.error(`Failed to stop background server ${pid}: ${error.message || error}`);
    process.exit(1);
  }
}

function status() {
  const pid = runningPid();
  if (pid) {
    console.log(`Server running in background (pid ${pid})`);
    console.log(`Logs: ${logFile}`);
  } else {
    console.log('No background server is running.');
  }
}

function readPid() {
  try {
    const pid = Number(fs.readFileSync(pidFile, 'utf8').trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function runningPid() {
  const pid = readPid();
  return pid && isAlive(pid) ? pid : null;
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error && error.code === 'EPERM';
  }
}

function clearPidFile() {
  try {
    fs.unlinkSync(pidFile);
  } catch {
    // already gone
  }
}
