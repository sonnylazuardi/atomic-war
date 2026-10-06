// Post-build: make dist/ an installable PWA.
// Bun's HTML bundler resolves every <link href>, so PWA files that must keep stable URLs
// (manifest, icons, service worker, Cloudflare _headers) live in public/ and are copied here;
// their <head> tags are injected into the built index.html.
import { cpSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dir, '..');
const dist = join(root, 'dist');
cpSync(join(root, 'public'), dist, { recursive: true });

const HEAD = `
    <meta name="description" content="8-player auto-battler inspired by Dota 2's Atomic War — vs bots or online." />
    <meta name="theme-color" content="#14111f" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Atomic War" />
    <meta name="application-name" content="Atomic War" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
    <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  `;
const file = join(dist, 'index.html');
const html = readFileSync(file, 'utf8');
if (!html.includes('rel="manifest"')) writeFileSync(file, html.replace('</head>', `${HEAD}</head>`));
console.log('postbuild: copied public/ and injected PWA head tags');
