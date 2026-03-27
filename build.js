#!/usr/bin/env node

'use strict';

const fs   = require('fs');
const path = require('path');
const https = require('https');

const GITHUB_USER   = 'elkuku';
const PLUGINS_FILE  = path.join(__dirname, 'plugins.txt');
const TEMPLATE_FILE = path.join(__dirname, 'src', 'template.html');
const OUTPUT_FILE   = path.join(__dirname, 'dist', 'index.html');
const STYLE_SRC     = path.join(__dirname, 'src', 'style.css');
const STYLE_DEST    = path.join(__dirname, 'dist', 'style.css');
const FETCH_TIMEOUT = 10_000;

// ---------------------------------------------------------------------------
// Load plugin list
// ---------------------------------------------------------------------------

const lines = fs.readFileSync(PLUGINS_FILE, 'utf8').split('\n');
const repos = lines
  .map(l => l.trim())
  .filter(l => l !== '' && !l.startsWith('#'));

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

function fetchJson(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: FETCH_TIMEOUT, headers: { 'User-Agent': 'iitc-plugins-builder/1.0' } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve(typeof data === 'object' && data !== null ? data : null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCard(p) {
  const githubUrl = `https://github.com/${GITHUB_USER}/${esc(p.repo)}`;

  let stableBlock = '';
  if (p.version !== null) {
    const date  = p.publishedAt ? `<span class="date">${esc(p.publishedAt)}</span>` : '';
    const dlBtn = p.downloadURL
      ? `<a class="btn btn-install" href="${esc(p.downloadURL)}" title="Install stable version">Install</a>`
      : '';
    stableBlock = `
        <div class="release stable">
          <span class="badge badge-stable">v${esc(p.version)}</span>${date}
          ${dlBtn}
        </div>`;
  }

  let betaBlock = '';
  if (p.betaVersion !== null) {
    const bDate  = p.betaPublishedAt ? `<span class="date">${esc(p.betaPublishedAt)}</span>` : '';
    const bDlBtn = p.betaDownloadURL
      ? `<a class="btn btn-beta" href="${esc(p.betaDownloadURL)}" title="Install beta version">Install beta</a>`
      : '';
    betaBlock = `
        <div class="release beta">
          <span class="badge badge-beta">v${esc(p.betaVersion)} beta</span>${bDate}
          ${bDlBtn}
        </div>`;
  }

  const releasesBlock = (stableBlock || betaBlock)
    ? `<div class="releases">${stableBlock}${betaBlock}</div>`
    : '<p class="no-release">No release info available</p>';

  return `
    <div class="plugin-card">
      <div class="card-header">
        <h3 class="plugin-name">${esc(p.name)}</h3>
        <span class="category-tag">${esc(p.category)}</span>
      </div>
      <p class="plugin-desc">${esc(p.description)}</p>
      ${releasesBlock}
      <div class="card-links">
        <a class="link" href="${esc(p.homepage)}" target="_blank" rel="noopener">Page</a>
        <a class="link" href="${githubUrl}" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>`;
}

function renderFailedCard(repo) {
  const githubUrl = `https://github.com/${GITHUB_USER}/${esc(repo)}`;
  return `
    <div class="plugin-card plugin-card--unavailable">
      <div class="card-header">
        <h3 class="plugin-name">${esc(repo)}</h3>
        <span class="category-tag">?</span>
      </div>
      <p class="plugin-desc unavailable-msg">Metadata currently unavailable.</p>
      <div class="card-links">
        <a class="link" href="${githubUrl}" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>`;
}

function renderContent(grouped, failed) {
  let sections = '';

  for (const [category, plugins] of Object.entries(grouped)) {
    const catId   = category.toLowerCase().replace(/\W+/g, '-');
    const cards   = plugins.map(renderCard).join('\n');
    sections += `
    <section class="category-section" id="cat-${esc(catId)}">
      <h2 class="category-heading">${esc(category)}</h2>
      <div class="plugin-grid">
        ${cards}
      </div>
    </section>`;
  }

  if (failed.length > 0) {
    const failedCards = failed.map(renderFailedCard).join('\n');
    sections += `
    <section class="category-section" id="cat-unavailable">
      <h2 class="category-heading">Unavailable</h2>
      <div class="plugin-grid">
        ${failedCards}
      </div>
    </section>`;
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const plugins = [];
  const failed  = [];

  for (const repo of repos) {
    const url  = `https://${GITHUB_USER}.github.io/${repo}/plugin.json`;
    process.stdout.write(`Fetching ${url} ... `);
    const data = await fetchJson(url);

    if (data === null) {
      console.error('WARN: failed');
      failed.push(repo);
      continue;
    }

    console.log('ok');
    plugins.push({
      repo,
      name:            (data.name ?? repo).replace('IITC plugin: ', ''),
      description:     data.description     ?? '',
      category:        data.category        ?? 'Misc',
      version:         data.version         ?? null,
      downloadURL:     data.downloadURL      ?? null,
      publishedAt:     data.publishedAt      ?? null,
      betaVersion:     data.betaVersion      ?? null,
      betaDownloadURL: data.betaDownloadURL  ?? null,
      betaPublishedAt: data.betaPublishedAt  ?? null,
      homepage:        `https://${GITHUB_USER}.github.io/${repo}/`,
    });
  }

  // Group by category
  const grouped = {};
  for (const plugin of plugins) {
    (grouped[plugin.category] ??= []).push(plugin);
  }

  // Sort categories (Misc last, rest alphabetical)
  const sortedGrouped = Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => {
      if (a === 'Misc') return 1;
      if (b === 'Misc') return -1;
      return a.localeCompare(b);
    })
  );

  // Sort plugins within each category alphabetically
  for (const plugins of Object.values(sortedGrouped)) {
    plugins.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Render
  const now       = new Date();
  const generated = now.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const content   = renderContent(sortedGrouped, failed);
  const template  = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const html      = template
    .replace('{{CONTENT}}', content)
    .replace('{{GENERATED}}', generated);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
  fs.copyFileSync(STYLE_SRC, STYLE_DEST);

  console.log(`\nDone. ${plugins.length} plugin(s) loaded, ${failed.length} failed.`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(err => { console.error(err); process.exit(1); });
