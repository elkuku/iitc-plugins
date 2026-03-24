# KuKu's IITC Plugins

Index page for [elkuku's IITC plugins](https://iitc.app).

**Live site:** https://elkuku.github.io/iitc-plugins/

## How it works

`plugins.txt` lists the repository names of all plugins. A PHP build script (`build.php`) fetches `plugin.json` from each plugin's GitHub Pages URL and generates a static `docs/index.html`. GitHub Pages serves the result.

The index is rebuilt automatically every day and on any push that changes `plugins.txt` or `build.php`.

## Adding a plugin

1. Add the repository name to `plugins.txt`.
2. Make sure the plugin's GitHub Pages publishes a `plugin.json` at `https://elkuku.github.io/<repo>/plugin.json` with the following structure:

```json
{
  "name": "IITC plugin: YourPlugin",
  "id": "iitc_plugin_YourPlugin",
  "category": "Category",
  "description": "Short description.",
  "author": "elkuku",
  "downloadURL": "https://elkuku.github.io/<repo>/files/release/plugin.user.js",
  "version": "1.0.0",
  "publishedAt": "2025-01-15",
  "betaVersion": "1.1.0-beta",
  "betaDownloadURL": "https://elkuku.github.io/<repo>/files/dev/plugin.beta.user.js",
  "betaPublishedAt": "2025-03-01"
}
```

Beta fields are optional.

## Building locally

```bash
php build.php
```

Output is written to `docs/index.html`.
