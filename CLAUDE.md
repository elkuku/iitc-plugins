# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build

```bash
node build.js
```

No package manager or dependencies — pure Node.js using only built-in modules (`fs`, `path`, `https`). Output goes to `dist/` (gitignored). GitHub Actions deploys `dist/` to GitHub Pages automatically on push (to specific paths) or daily at 6 AM UTC.

## Architecture

This project aggregates metadata from multiple IITC plugin repositories into a single static index page.

**Data flow:**
1. `plugins.txt` — list of GitHub repo names (one per line, `#` for comments)
2. `build.js` fetches `https://elkuku.github.io/<repo>/plugin.json` for each repo
3. Plugins are grouped by `category`, sorted alphabetically within each group
4. `src/template.html` is rendered by substituting `{{CONTENT}}` and `{{GENERATED}}` placeholders
5. Output written to `dist/index.html`; `src/style.css` copied to `dist/style.css`

**Key functions in `build.js`:**
- `fetchJson(url)` — HTTPS fetch with 10s timeout
- `renderCard(p)` / `renderFailedCard(repo)` — HTML for each plugin card
- `renderContent(grouped, failed)` — assembles all category sections

**Expected `plugin.json` schema** (per plugin repo's GitHub Pages):
- Required: `name`, `id`, `category`, `description`, `author`, `downloadURL`, `version`, `publishedAt`
- Optional: `betaVersion`, `betaDownloadURL`, `betaPublishedAt`

## Notes

- `.claude/settings.local.json` still references the old PHP build (`php build.php`, `docs/`). The project was migrated to Node.js (`build.js`, `dist/`).
- Plugins can be disabled by commenting them out in `plugins.txt` with `#`.
