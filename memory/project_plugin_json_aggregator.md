---
name: Plugin JSON aggregator setup
description: How to set up a plugin repo so it publishes plugin.json to GitHub Pages for the iitc-plugins aggregator index
type: project
---

Each plugin repo must publish a `plugin.json` to its GitHub Pages root so that `iitc-plugins/build.php` can fetch it at `https://elkuku.github.io/{repo}/plugin.json`.

## Required fields in the deployed plugin.json

```json
{
  "name":        "IITC plugin: ...",
  "id":          "iitc_plugin_...",
  "category":    "...",
  "description": "...",
  "author":      "elkuku",
  "downloadURL": "https://elkuku.github.io/{repo}/files/release/{id}.user.js",
  "version":     "v1.0",
  "publishedAt": "2024-Jan-01"
}
```

Optional (beta) fields: `betaVersion`, `betaDownloadURL`, `betaPublishedAt`.

## How it works

The file is generated at build time by `.github/scripts/setup-github-page.js` and written to `gh_page/plugin.json`, which is then deployed to GitHub Pages.

## Checklist for a new plugin repo

1. **`plugin.json`** (repo root) — static metadata (name, id, category, description, author, downloadURL, icon). Does NOT need version/date fields.

2. **`.github/scripts/create-changelog.js`** — parse git tags with taggerdate:

   ```js
   '--format="%(refname:strip=2)%00%(taggerdate:format:%Y-%b-%d)%00%(contents)%00"'
   // parse fields i+=3: { name, date, message }
   ```

3. **`.github/scripts/setup-github-page.js`** — after writing `gh_page/index.html`, add:

   ```js
   // Determine version/date from latest tag
   let version = 'n/a', releaseDate = 'n/a'
   if (tags[0]) {
       version = tags[0].name
       releaseDate = tags[0].date
   }

   // Write aggregator plugin.json
   const aggregatorMeta = {
       name: pluginData.name, id: pluginData.id,
       category: pluginData.category, description: pluginData.description,
       author: pluginData.author, downloadURL: pluginData.downloadURL,
       version: version !== 'n/a' ? version : undefined,
       publishedAt: releaseDate !== 'n/a' ? releaseDate : undefined,
   }
   Object.keys(aggregatorMeta).forEach(k => aggregatorMeta[k] === undefined && delete aggregatorMeta[k])
   fs.writeFileSync('gh_page/plugin.json', JSON.stringify(aggregatorMeta, null, 2), 'utf8')
   ```

4. **`.github/page/index.html`** — use `{{RELEASE_DATE}}` placeholder in the version display:

   ```html
   Latest Version: <span class="badge text-bg-primary">{{PROJECT_VERSION}}</span>
                   <span class="badge text-bg-secondary">{{RELEASE_DATE}}</span>
   ```

5. **`iitc-plugins/plugins.txt`** — add the repo name (uncommented).

## Reference implementation

`iitc-kuku-inventory` is the canonical up-to-date example.