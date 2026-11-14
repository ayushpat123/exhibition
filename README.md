# EXBT

A lightweight exhibition of the original 2021 generative sketches and photographs.

**Live:** https://ayushpat123.github.io/exhibition/

The gallery is plain HTML and CSS; its two canvas sketches use a single small JavaScript bundle. All startup resources are served from the same host. No React, p5.js, external stylesheets, fonts, trackers, or image gateways are required.

## Develop

Use Node 24 (`nvm use` if you have nvm), then:

```sh
npm ci
npm test
npm run build
node scripts/check-build.mjs
npm start
```

`npm start` serves the production build at http://localhost:3000 (requires Python 3). All asset URLs are relative, so the same build works at the domain root or under `/exhibition/`.

- `site/index.html`: page shell; the gallery is rendered at build time.
- `site/gallery.json`: photo records, descriptions, notes, colours, groups, and display order.
- `scripts/render-gallery.mjs`: validates the catalogue and renders static, accessible photo cards.
- `src/photos.js`: tap/click/keyboard flip interaction.
- `site/styles.css`: the original pale background, dark cards, and responsive grid.
- `site/assets/`: recovered artwork, responsive WebP variants, and static animation posters.
- `src/motion.js`: waves, particles, and animation lifecycle.
- `src/main.js`: motion control.
- `scripts/build.mjs`: bundles and hashes CSS/JavaScript into `build/`.
- `tests/motion.test.mjs`: startup, visibility, motion preferences, resize, touch, and timing checks.

The waves retain ten white noise-driven lines. Moving right increases frequency (more tightly packed bends); moving down increases amplitude (taller waves). The amplitude ranges from 5% to 25% of canvas height, with its former 50% maximum halved. Wave motion now runs at half its previous speed, while the render cadence remains capped at 60 updates/second. The particles retain the original accumulating translucent circles. Frame pacing is capped at 60 updates/second, elapsed time controls speed, pixel density is capped at 2, and hidden/offscreen sketches pause automatically. The operating-system reduced-motion preference starts the sketches paused with a visible image. The visitor can toggle motion explicitly.

## Hosting

Pushing `master` tests and builds the site, checks payload budgets and asset references, then updates the existing `gh-pages` branch. GitHub Pages remains configured to serve that branch. Hashed script/style names prevent old bundles being reused after deployment. `version.json` identifies the deployed build.

`amplify.yml` supplies equivalent Node 24 build instructions for the former AWS Amplify site. Its account settings and deployment status have not been verified; GitHub Pages is the confirmed deployment target.

## Artwork and recovery

The seven working images were recovered from the original repository and its Google-hosted image URLs on 2026-11-14, then converted to responsive WebP files. See `scripts/image-manifest.json` for dimensions and sizes. Original source URLs and the original sketches remain in Git history, notably commit `da62c8c`.

Two additional photographs (blue seascape and red fish) were added on 2026-11-14 as the exact uploaded JPEG bytes. They use CSS black framing and `object-fit: contain`, with no cropping, colour edits, or recompression. The blue seascape is grouped directly below the blue patterned tile at every screen width. Their checksums are recorded in `scripts/image-manifest.json`.

The final IPFS artwork (`QmdiGgzfqxVRS4euboQbBpbRaqe4HX3zkDJgouDd18weRt`) could not be retrieved from the gateways checked. The unavailable placeholder and archive link have been removed from the gallery.

## Measured changes

Compared with the existing `gh-pages` build at `a170b3a`:

| Resource | Before | After |
| --- | ---: | ---: |
| All JavaScript bundles, uncompressed | 988,826 B | 5,854 B |
| JavaScript, summed gzip sizes | 243,558 B | 2,589 B |
| Seven original gallery images | 10,999,508 B | 1,518,324 B across all responsive variants |
| Render-blocking external stylesheet | 155,845 B | Removed |
| External resource hosts needed to render | jsDelivr, Google Images, IPFS | None |

The new animation posters add 19,964 B and the logo adds 3,565 B. Only one size of each responsive image is requested, and below-fold images are lazy-loaded. These are artifact sizes, not an end-user load-time or FPS measurement.

Automated lifecycle tests and build integrity checks pass. Individual canvas artwork frames were rendered and visually inspected using native Canvas. Browser automation was disabled during this session, so full-page visual QA, browser performance traces, Safari/iPhone checks, and the corporate network's behavior still require an actual browser check. No claim of a particular device frame rate or cold-load time is made.

## Rollback

Revert the optimization commit on `master` and push; deployment rebuilds the previous version. Alternatively restore the previous `gh-pages` tree from `a170b3a` in a new commit. Avoid rewriting branch history.

## Photo backs and notes

The stationary photo wrapper is transparent and unclipped; the rotating front/back faces own the frame surface, corner clipping, and shadow so the entire framed card turns as one object. Both Reine photographs are borderless by default, with their original JPEG bytes preserved.

Click or tap a photo to flip it; click again or press Escape to return. Native buttons also support Enter and Space. Reduced-motion settings make the change immediate. Notes use restrained typography with at least 4.5:1 text contrast. Photos remain visible if JavaScript is unavailable.

Edit `title` and `notes` for the relevant stable ID in `site/gallery.json`, then rebuild and deploy. Notes are published content, not browser storage. Empty notes show just the title; no personal details or location claims have been invented. Newlines in notes are preserved and HTML is escaped.

Each record stores:

- `colors.frame`: the exact displayed frame colour, or `null` for frameless images.
- `colors.base`: the dominant colour of the whole image, retained for future grouping.
- `colors.edge` and `colors.edgePalette`: colours sampled from the outer 5% band, retained separately from the whole-image palette. Back colour resolves to frame first, then edge, then base as a legacy fallback.
- `colors.palette`: five weighted swatches, each with hex and OKLCH lightness, chroma, and hue. These support future perceptual colour matching rather than comparisons of hex strings.
- `layout`: image fit, frame inset percentage, and portrait sizing.

`order` contains stable item/group IDs; `groups.blue-pair.members` preserves the blue tiles above the blue seascape. Neither order nor flip state is stored in the photo's notes/colour record. Every rendered card has a `data-item-id`, and `#gallery-data` embeds the catalogue for future runtime position changes without a network request. Automatic colour reordering is not enabled yet.

To sample a new photo without changing its file, use `python3 scripts/sample-colors.py path/to/photo.jpg --frame '#000000'` (requires Pillow). For a frameless photo, omit `--frame`. Sampling assumes sRGB and uses median-cut quantization on a maximum 100 px thumbnail; it is a grouping aid, not a colour-calibration measurement.

Photographer-supplied capture details are stored in optional `capture` records: local `date` and `time`, `timeBasis`, `location`, and `source`. Their date/time line is formatted from the record on the photo back; it is not duplicated in free-text notes. These local capture records do not imply a UTC offset or GPS coordinates.

## Owner-only border settings

The public gallery has no border editor, preview controls, publishing links, or owner menu. It only displays the published artwork and photo backs.

On your phone, open [Set photo borders](https://github.com/ayushpat123/exhibition/actions/workflows/publish-borders.yml) while signed into GitHub as `ayushpat123`. Tap **Run workflow**, choose the photo, width and colour, then confirm. Width presets are None/Narrow/Medium/Wide/Extra wide/Very wide (0/3/6/12/20/30%), with a custom 0–45% option. Width is measured per side as a percentage of the tile width, including the top/bottom padding. At the normal 300 px tile width, these are 0/9/18/36/60/90 px per side. For example, Custom 20 means 60 px on each side, leaving a 180 px-wide image area. Custom 45 means 135 px per side. Smaller tiles scale these pixel values down proportionally. The dropdown includes these size references. Colour presets include Black/Charcoal/Ivory/From edges, with a custom six-digit hex option. Keep current preserves the saved width or colour.

Only the repository owner's signed-in workflow runs are accepted, with the account checked both in the workflow and update script. Issue submissions cannot publish. No credentials or editor controls are included in the public site. The workflow saves only the selected border, preserves the photo, notes, capture records, and palette data, then tests/builds/deploys the public gallery. A border update takes effect after a short rebuild and page reload.

The workflow explicitly requests the legacy Pages build after updating its deployment branch, because workflow-token pushes do not trigger Pages builds by themselves ([GitHub documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)).

## Card-back typography and locations

Card backs use self-hosted **Courier Prime Regular**, a quiet typewriter face, with a Courier New/monospace fallback and `font-display: swap`. The Latin WOFF2 file is 18,640 B; no external font requests are required. Vendored from `@fontsource/courier-prime` 5.3.0, designed by Alan Dague-Greene for Quote-Unquote Apps ([official font](https://quoteunquoteapps.com/courierprime/)). Its SIL Open Font License is included at `site/assets/CourierPrime-OFL.txt`.

Visible return instructions are omitted; tapping or pressing Escape still restores the image. Every recorded location must include `capture.location.country`; the build validates this and displays the country with the location. Country codes may also be stored. Unknown locations on older images remain unset rather than being guessed. Both Reine photos record Norway (NO). The red Reine photograph has no free-text note; its location and capture date/time remain visible.

Photo-back captions sit near the bottom with a quiet inset. The two Reine backs each show only a place/country heading and the local capture date/time. The blue boat's full trek context remains stored in capture metadata; `location.landmark` supplies “Reinebringen” for its compact heading. Other captured photos use the town when no landmark is supplied.

## Small Groves — phone tree studio

Open https://ayushpat123.github.io/exhibition/trees/ or the gallery's **Make a little forest** link. Tap the white canvas to plant a seeded cluster of 10–20 low-poly trees. Each tree varies in crown mesh, species, shape, tilt, size and colour. The UI offers next-tap size/spread/count/palette controls, undo, a two-tap clear, seed variations, and PNG export at 2000 × 2000 px. Supported phones can use their share sheet to save the PNG to Photos.

Scenes autosave only in this browser's local storage. **Save editable copy** exports the seed and planting gestures as JSON; **Open a copy** validates and restores it on another device. Drawings are not uploaded or published. Storage can be cleared by the browser, so export important compositions. Settings affect the next planting; changing the seed regenerates the current pattern. There is a 100-grove limit to keep phone rendering bounded.

`src/trees.js` contains the deterministic mesh and rendering code; `src/tree-studio.js` handles the studio. It renders on interaction/resize and remains idle otherwise. The separate studio bundle is about 10 KB and is not loaded by the gallery. Tests cover reproducibility, 10–20 counts, mesh bounds/variation, scene import validation, white export backgrounds, pointer cancellation during scrolling, undo, clear, seed changes, and image preparation. Native Canvas renderings were visually inspected; the DOM tests do not replace an actual iPhone/browser check, which remains unavailable in this session. The generative direction is documented in `docs/tree-studio.md`.
