# Bird Explorer

A mobile-first, independent bird discovery prototype. Browse five species, choose a possible match, and create a shareable 1080 × 1080 PNG. Built with HTML, CSS, ES modules, JSON, and Canvas. No build step, account, analytics, storage, or backend.

## Run locally

Use the existing checkout; no additional worktree is needed. From the repository directory:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. Serve over HTTP rather than opening `index.html` as a file: the browser must fetch the JSON catalog and JavaScript modules. Stop with Ctrl+C.

To reproduce GitHub Pages' subpath locally, serve the parent folder:

```sh
cd /workspace
python3 -m http.server 8000
```

The application is then at `http://localhost:8000/bird-explorer/`. All site assets use relative URLs. There are no required environment variables, credentials, or package installations to run the app.

## Using the prototype

1. Choose **Find My Bird**, then search by common or scientific name.
2. Select a species, read its description, and choose **Create My Badge**.
3. Download the PNG or use native sharing when your browser supports image-file sharing.

**Identify with Merlin** explains the external identification workflow and opens Merlin's official website in a new tab. Return here to select the species. Bird Explorer is not affiliated with Merlin or the Cornell Lab of Ornithology.

Badges say **Possible identification • Not verified** within the exported image. They support birds encountered by sight or sound and are not verified sightings.

## Files and extension points

- `data/species.json`: species, descriptions, image paths, focal points, and licensing metadata.
- `assets/birds/`: local artwork (currently temporary SVG illustrations).
- `js/catalog.js`: loading, validation, and search.
- `js/badge.js`: focal-point crop, rendering, and PNG export.
- `js/app.js`: navigation, UI state, downloads, and sharing.
- `styles.css`: responsive visual design.
- `tests/`: catalog/crop unit checks and optional browser integration checks.

To add a bird, add an approved local image under `assets/birds/` and an entry in the JSON catalog. No JavaScript changes are needed. Use unique `code` values and the existing entry shape. `focalX` and `focalY` are normalized from 0 to 1, identifying the subject's center in the source image. The badge performs a cover crop around that point, clamped to the source edges.

For photographs, set `imagePlaceholder` to `false`, preserve `imageLicense` and `imageCredit`, and verify that the license explicitly permits the intended use, redistribution, and derivative badge exports. CC0 is preferred for this prototype. Only local SVG, PNG, JPEG, and WebP assets are accepted; keep SVGs self-contained with explicit dimensions. Do not put unreviewed third-party images into the catalog.

## Artwork and licensing

No bird photographs were downloaded or used. The five original SVGs are deliberately simplified **temporary illustrations**, not identification references or accurate plumage guides. Their placeholder status appears in the catalog, detail screen, home feature, and exported badges. These SVG assets are dedicated under **CC0 1.0 Universal**: https://creativecommons.org/publicdomain/zero/1.0/. No third-party illustration assets or fonts are used. Replace them with licensed photographs before treating this as a photographic field guide.

## Tests

Node 24 is used in CI. Runtime operation does not require Node.

```sh
node tests/catalog.test.mjs
```

Four unit tests cover catalog metadata and asset presence, common/scientific name searches, apostrophe normalization, HTTP and validation failures, and focal crop boundaries.

Optional browser tests require development-only Playwright and a browser; neither ships with the site:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
# With the parent-directory static server running:
CHROMIUM_PATH=/path/to/chromium node tests/browser.cjs
```

`CHROMIUM_PATH` defaults to `/usr/bin/chromium`. Alternatively set it to Playwright's Chromium executable path. `TEST_URL` overrides the default `http://127.0.0.1:8000/bird-explorer/`. To also test WebKit, install it using `npx playwright install webkit` and run with `TEST_WEBKIT=1`. Browser dependencies are optional and ignored by Git.

The browser suite checks search, selection, every species' badge export, PNG dimensions, real download creation, simulated native sharing/cancellation/unsupported sharing, catalog retry, missing-image fallback, 320px layout, Pages subpaths, and uncaught JS errors. It writes review screenshots under `/tmp/`.

### Validation and remaining compatibility checks

- Passed Node unit tests and Chromium automation with a touch-enabled mobile viewport, 320px narrow layout, and desktop screenshots.
- Confirmed all five local images produce PNGs and forced image failures produce a labeled, downloadable fallback.
- Native share calls are tested with browser API stubs. Actual operating-system share sheets and destination apps need manual testing.
- WebKit installation was blocked by network policy in the development environment. iOS Safari and physical Android Chrome have **not** been verified on devices.

Before release, test on iOS Safari and Android Chrome over HTTPS: search, Merlin return flow, text readability, download/save-to-Photos behavior, file sharing, cancellation, and download fallback. Social apps may handle image shares differently. Native file sharing is feature-detected and generally requires HTTPS; GitHub Pages supplies HTTPS. If a download opens the PNG instead of saving it, use the browser's Share menu or touch and hold to save. A failed image never prevents exporting the rest of the badge. If catalog loading fails, the app offers a retry.

## GitHub Pages deployment

A workflow is supplied in `.github/workflows/pages.yml`; it validates the catalog, assembles only public site files, and deploys them to Pages. It does not publish the cloud environment.

1. Commit the project and push to `main` in `Chriselj/bird-explorer`.
2. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
3. Let **Deploy static site to Pages** run, or trigger it manually from Actions.
4. After successful deployment, check `https://chriselj.github.io/bird-explorer/` and the full badge flow.

No deployment has been triggered by this implementation. The workflow requires Pages to be enabled and repository Actions permissions to allow deployment. `.nojekyll` is included; no server-side processing is used.

## Scope

No location access, personal-data collection, accounts, observations database, organizational branding, or external monitoring data. No offline cache or service worker yet. Species data and badge rendering are separate so later catalog expansions and badge designs do not require rewriting the visitor flow.
