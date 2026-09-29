import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

// The app's settings live in the repo-root .env, but Next only reads .env files next to this config.
// Load the root ones too, so NEXT_PUBLIC_API_URL / NEXT_PUBLIC_WS_URL get built in instead of the
// localhost fallback. Values already in the environment (shell, Docker build args) still win.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
nextEnv.loadEnvConfig(repoRoot, process.env.NODE_ENV !== 'production');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
