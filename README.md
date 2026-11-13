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

The waves retain ten white noise-driven lines and pointer-controlled frequency/amplitude. The particles retain the original accumulating translucent circles. Frame pacing is capped at 60 updates/second, elapsed time controls speed, pixel density is capped at 2, and hidden/offscreen sketches pause automatically. The operating-system reduced-motion preference starts the sketches paused with a visible image. The visitor can toggle motion explicitly.

## Hosting

Pushing `master` tests and builds the site, checks payload budgets and asset references, then updates the existing `gh-pages` branch. GitHub Pages remains configured to serve that branch. Hashed script/style names prevent old bundles being reused after deployment. `version.json` identifies the deployed build.

`amplify.yml` supplies equivalent Node 24 build instructions for the former AWS Amplify site. Its account settings and deployment status have not been verified; GitHub Pages is the confirmed deployment target.

## Artwork and recovery

The seven working images were recovered from the original repository and its Google-hosted image URLs on 2026-11-14, then converted to responsive WebP files. See `scripts/image-manifest.json` for dimensions and sizes. Original source URLs and the original sketches remain in Git history, notably commit `da62c8c`.

Two additional photographs (blue seascape and red fish) were added on 2026-11-14 as the exact uploaded JPEG bytes. They use CSS black framing and `object-fit: contain`, with no cropping, colour edits, or recompression. The blue seascape is grouped directly below the blue patterned tile at every screen width. Their checksums are recorded in `scripts/image-manifest.json`.

The final IPFS artwork (`QmdiGgzfqxVRS4euboQbBpbRaqe4HX3zkDJgouDd18weRt`) could not be retrieved from the gateways checked. Its position now contains an explicit archive link; the page does not make a failing gateway request on startup. This image has not been replaced with invented artwork.

## Measured changes

Compared with the existing `gh-pages` build at `a170b3a`:

| Resource | Before | After |
| --- | ---: | ---: |
| All JavaScript bundles, uncompressed | 988,826 B | 9,843 B |
| JavaScript, summed gzip sizes | 243,558 B | 4,062 B |
| Seven original gallery images | 10,999,508 B | 1,518,324 B across all responsive variants |
| Render-blocking external stylesheet | 155,845 B | Removed |
| External resource hosts needed to render | jsDelivr, Google Images, IPFS | None |

The new animation posters add 23,672 B and the logo adds 3,565 B. Only one size of each responsive image is requested, and below-fold images are lazy-loaded. These are artifact sizes, not an end-user load-time or FPS measurement.

Automated lifecycle tests and build integrity checks pass. Individual canvas artwork frames were rendered and visually inspected using native Canvas. Browser automation was disabled during this session, so full-page visual QA, browser performance traces, Safari/iPhone checks, and the corporate network's behavior still require an actual browser check. No claim of a particular device frame rate or cold-load time is made.

## Rollback

Revert the optimization commit on `master` and push; deployment rebuilds the previous version. Alternatively restore the previous `gh-pages` tree from `a170b3a` in a new commit. Avoid rewriting branch history.

## Photo backs and notes

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

## Set borders from a phone

Flip any photo, then tap **Border**. The editor offers width presets, a slider, a native colour picker, and black/charcoal/ivory/edge-colour shortcuts. Width is stored as a percentage so frames scale with the tile. Previews change both the front frame and the reverse surface; choosing no border makes the reverse use the image-edge colour. Closing the editor without publishing restores the saved border. Photo files are never altered.

**Publish via GitHub** opens a prefilled GitHub issue for confirmation. Sign in as `ayushpat123` and submit it. The owner-only `publish-borders.yml` workflow validates the request, updates only that photo's border in `site/gallery.json`, tests/builds the site, commits the source, and deploys the public gallery. Reload the gallery after the rebuild to see the shared setting on every device. Previewing is immediate; publishing requires confirmation and a rebuild. No GitHub credentials are entered or stored on EXBT.

Publishing requests from any other account are ignored. The workflow also accepts owner-only `workflow_dispatch` with a `border_json` input for verification. Issue data is read from the event JSON without shell interpolation; unknown fields, IDs, animations, invalid colours, and widths outside 0–30% are rejected. Normal visitors can preview but cannot publish. The repository's default branch is `master` so the issue workflow is active; the Pages source remains `gh-pages`.

The workflow explicitly requests the legacy Pages build after updating its deployment branch, because workflow-token pushes do not trigger Pages builds by themselves ([GitHub documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)). Prefilled publishing links use GitHub's documented [issue URL parameters](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue).
