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

- `site/index.html`: gallery and accessible image descriptions.
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

The final IPFS artwork (`QmdiGgzfqxVRS4euboQbBpbRaqe4HX3zkDJgouDd18weRt`) could not be retrieved from the gateways checked. Its position now contains an explicit archive link; the page does not make a failing gateway request on startup. This image has not been replaced with invented artwork.

## Measured changes

Compared with the existing `gh-pages` build at `a170b3a`:

| Resource | Before | After |
| --- | ---: | ---: |
| All JavaScript bundles, uncompressed | 988,826 B | 5,067 B |
| JavaScript, summed gzip sizes | 243,558 B | 2,317 B |
| Seven original gallery images | 10,999,508 B | 1,518,324 B across all responsive variants |
| Render-blocking external stylesheet | 155,845 B | Removed |
| External resource hosts needed to render | jsDelivr, Google Images, IPFS | None |

The new animation posters add 23,672 B and the logo adds 3,565 B. Only one size of each responsive image is requested, and below-fold images are lazy-loaded. These are artifact sizes, not an end-user load-time or FPS measurement.

Automated lifecycle tests and build integrity checks pass. Individual canvas artwork frames were rendered and visually inspected using native Canvas. Browser automation was disabled during this session, so full-page visual QA, browser performance traces, Safari/iPhone checks, and the corporate network's behavior still require an actual browser check. No claim of a particular device frame rate or cold-load time is made.

## Rollback

Revert the optimization commit on `master` and push; deployment rebuilds the previous version. Alternatively restore the previous `gh-pages` tree from `a170b3a` in a new commit. Avoid rewriting branch history.
