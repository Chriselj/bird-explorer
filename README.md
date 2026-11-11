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
- `js/badge.js`: layered Canvas rendering and PNG export.
- `js/badge-design.js`: landscape mapping and centralized visual settings.
- `js/app.js`: navigation, UI state, downloads, and sharing.
- `styles.css`: responsive visual design.
- `tests/`: catalog/crop unit checks and optional browser integration checks.

To add a bird, add an approved local image under `assets/birds/` and an entry in the JSON catalog. No JavaScript changes are needed. Use unique `code` values and the existing entry shape. `focalX` and `focalY` are normalized from 0 to 1, identifying the subject's center in the source image. The badge contains the entire illustration within its configured box, preserving proportions and transparency; focal metadata remains available for other views.

For photographs, set `imagePlaceholder` to `false`, preserve `imageLicense` and `imageCredit`, and verify that the license explicitly permits the intended use, redistribution, and derivative badge exports. CC0 is preferred for this prototype. Only local SVG, PNG, JPEG, and WebP assets are accepted; keep SVGs self-contained with explicit dimensions. Do not put unreviewed third-party images into the catalog.

## Artwork and licensing

No bird photographs were downloaded or used. The five original SVGs are deliberately simplified **temporary illustrations**, not identification references or accurate plumage guides. Their placeholder status appears in the catalog, detail screen, home feature, and exported badges. These SVG assets are dedicated under **CC0 1.0 Universal**: https://creativecommons.org/publicdomain/zero/1.0/. No third-party illustration assets or fonts are used. Replace them with licensed photographs before treating this as a photographic field guide.

## Tests

Node 24 is used in CI. Runtime operation does not require Node.

```sh
node tests/catalog.test.mjs
```

Nine unit tests cover catalog metadata and asset presence, common/scientific name searches, apostrophe normalization, HTTP and validation failures, focal crop boundaries, area defaults, calendar dates, local landscape mapping, and illustration containment.

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

## Visual style

Styled from the supplied Irvine Ranch Conservancy Brand & Style Guide (2019), pages 15–18: forest green `#1f772d`, sage `#8fb387`, brown `#58210c`, slate `#51575e`, and clean white space. The site and exported badges share the palette. Body type requests Lato; headings request Cronos Pro, with Arial and Trebuchet MS fallbacks respectively. Font files are not bundled: neither font was available locally and the font download failed because the environment proxy was unavailable. Supply licensed web font files to match typography exactly.

Bird Explorer retains its independent identity. No IRC logo or affiliation was added. Existing labeled bird illustrations remain placeholders; the guide favors active nature and local landscape photography, which should be sourced with appropriate reuse rights before replacing them.

## Discovery locations and dates

Link directly to a discovery area with `?area=limestone-canyon` (or `weir-canyon`, `agua-chinon`, `red-rock`, `gypsum-canyon`, `saddleback`). The centralized `AREAS` map in `js/discovery.js` supplies both URL recognition and selector labels. Missing and unknown values default to **No location**. The URL is read only on page load; changing species preserves visitor edits.

On the badge screen, visitors can change the area, remove it, or choose **Other location** and enter up to 100 characters for a general location. Blank custom locations omit the location line. The discovery date starts as the visitor’s local calendar date and is editable; an empty or invalid date disables sharing and download until corrected. Every edit regenerates the preview and PNG, and only the most recent render can become downloadable. No geolocation, external lookup, storage, or tracking is used. Details reset on reload.

With the local server and optional Playwright setup described above, run `node tests/discovery.cjs`. This verifies URL defaults, location edits/removal/custom text, a local date differing from UTC, date edits and validation, rapid changes, persistence across species, 320px layout, and byte-for-byte equality of the downloaded PNG and preview. The existing `node tests/browser.cjs` checks remain applicable.

## Landscape badge composition

The badge uses warm ivory paper, an optional monochrome landscape, the bird illustration, and understated field observation text. Both preview and PNG use the same Canvas composition. Existing bird artwork is unchanged.

Place supplied landscape sketches in `assets/areas/` using the names listed in its README. Temporary AI-generated landscape sketches are now bundled for each area and the default. They are illustrative stand-ins, not verified depictions of the locations; replace them with supplied finished artwork. A supported area tries its own `.webp`, then `default.webp`; missing/default/custom locations try `default.webp`. When files fail or are absent, the badge retains plain ivory paper and still exports. Location edits regenerate the background along with the observation text.

`js/badge-design.js` centralizes the local artwork mapping and `BADGE_DESIGN`: landscape opacity (default 0.65), contrast (3), brightness (0.8), its box, elliptical fade start and strength, bird box, paper/ink colors, fonts, and all text positions and sizes. The renderer desaturates and strengthens the landscape on a separate layer, fades its outer edges, and uses multiply compositing to blend the light paper into the ivory background. A smaller foreground box leaves the landscape visible around the current opaque bird illustrations. The bird remains at full opacity with no crop. Temporary opaque bird SVGs use multiply compositing so their pale background no longer hides the landscape; finished illustrations use normal compositing. Supply transparent bird illustrations to expose the landscape underneath; the current opaque temporary SVG backgrounds remain intact.

Run `node tests/landscapes.cjs` with the same optional Playwright/local server setup as the existing browser suites. It checks pixel-level opacity, grayscale and edge fade, preservation of transparent foreground proportions, area/default/paper fallbacks, missing bird exports, and real URL/manual selection image requests. Only in-memory geometric test fixtures are used, with no artwork files written.

## Trail engagement prototype

The welcome screen uses the existing URL-selected area to display its name, landscape, short observation prompt, and stewardship message. Visitors can change or remove the area immediately, including entering a custom general location; the welcome and badge selectors stay in sync. **Help me get started** introduces a quiet, safe observation pause. **I noticed a bird** opens the catalog directly.

Observation clues (ground, vegetation, flying/hovering, or heard) narrow the small catalog without claiming an identification. Search works within the selected clue; **Show all birds** resets the clue. The catalog explicitly describes its limited coverage and offers Merlin when no bird fits. Bird details add a distinguishing feature, a behavior to notice, a habitat connection, and comparison navigation.

`js/trail.js` centralizes draft area prompts/stewardship, browsing clues, and species tips. The tips expand on the existing catalog descriptions. They and the area prompts require local naturalist/editorial review before public release; they are not verified species lists for individual locations. All About Birds links on the field-note screen provide optional further reading in a new tab. No external request is needed to browse or create the PNG.

Visitors can optionally record Seen, Heard, or Both, plus an 80-character field note. These appear in both Canvas preview and PNG; text is normalized and fitted within the layout. Selecting **I heard it** preselects Heard, which remains editable. Comparing species preserves the draft; **Notice another bird** clears the previous observation's note, encounter, search, and clue while retaining date and location. All state remains in memory and resets on reload; there is no database, tracking, geolocation, or offline cache.

Run `node tests/trail.cjs` with the optional Chromium setup and local server described above. It covers the complete beginner flow, location/custom location edits, filters, comparison and Merlin, field-note text, identical preview/export output, further-reading and stewardship, repeat observations, 320px layout, and failed artwork. Screenshots are written under `/tmp/trail-*.png`. Existing discovery, landscape, and browser tests remain applicable. Outdoor sunlight, weak reception, and physical-device usability still need a real trail trial.

## Naturalistic test bird sketches

The active catalog uses five AI-generated colored-pencil/watercolor-style bird sketches in `assets/birds/*.webp`, with real alpha transparency. They are visual prototypes, not expert-reviewed identification references. `imagePlaceholder` remains true so the temporary-illustration label appears in the catalog, details, and PNG. `imageTransparent: true` uses normal Canvas compositing to preserve the bird colors while showing the landscape through transparent pixels. Catalog and detail images use contain sizing to keep bills, tails, and feet visible.

The original simplified CC0 SVGs remain as archived local assets; their dedication does not describe the new AI-generated sketches. The new catalog credit identifies the generated test artwork separately. Replace the WebP paths with approved final artwork when available.
