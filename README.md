# MoatBench

**what if your moat is a literal fucking moat**

An independent evaluation of language models on literal moat construction. A static benchmark publication with genuine model responses, reproducible collection records, public-domain reference photography, and sourced excavation equipment data.

The central task is:

```text
dig me a moat here
```

The initial protocol gives models a text interface and no physical actuator. All accepted responses therefore tie at a protocol-defined 0% completion. This is not a field measurement. Actual model answers are preserved verbatim; actual external excavation figures are cited separately.

## Run the website

Requires Node.js 22 or newer.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Build the GitHub Pages artifact:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

The site uses relative asset URLs so it can run at the `/moatbench/` GitHub Pages project path. There is no backend, database, authentication, analytics, cookie banner, or browser API credential.

## Repository

Source: [tobiasosborne/moatbench](https://github.com/tobiasosborne/moatbench). Live site: [tobiasosborne.github.io/moatbench](https://tobiasosborne.github.io/moatbench/).

The workflow verifies the evidence, builds `dist/` and deploys to GitHub Pages on every push to `main`. Deployment is gated on the repository Actions variable `PAGES_ENABLED`, currently `true`.

## Data and provenance

| File | Purpose |
| --- | --- |
| `public/data/evaluations.json` | Successful transcripts, collection failures, protocol and run summary |
| `benchmark/runs/` | Sanitized API records, usage, timestamps, response hashes and budget ledger |
| `benchmark/models-snapshot.json` | Dated OpenRouter model catalogue used for the run |
| `benchmark/plan.json` | Explicit selected model IDs |
| `public/data/annotations.json` | Editorial classification of each transcript's primary move (authored; does not affect scores) |
| `public/data/equipment.json` | Manufacturer specifications and external field-production figures |
| `public/data/assets.json` | Visual-asset source and public-domain licence records |
| `scripts/benchmark.py` | Budget-limited collector; dry run by default |
| `scripts/verify_data.py` | Offline integrity and budget checks |
| `scripts/package-evidence.mjs` | Generates the public downloadable evidence bundle before dev/build |

See [benchmark methodology](docs/BENCHMARK.md), [equipment sources](docs/EQUIPMENT.md), and [asset provenance](docs/ASSETS.md).

See [verification results and screenshots](docs/VERIFICATION.md) for the desktop/mobile browser checks. The field-track section proposes evaluations at Coogee Beach, Sydney, for a US$10,000 per-model participation fee; the page discloses that no laboratory has nominated a model and no field evaluation has occurred.

The completed first run contains **54 complete transcripts from 64 attempted model IDs**. Ten collection failures are unscored. API records contain US$0.063016 in known charges and US$0.320573 in retained reservations for uncertain charges. The observed account usage delta was US$0.109425, including concurrent coding activity and any failed-request billing.

No model replies, field measurements, sponsors, or successful human baseline have been invented. The photograph is a reference scene, not documentation of these API runs. Its before/after comparison deliberately uses the same image.

## Run the benchmark

Python 3 standard library; OpenRouter credential required only for paid collection.

```sh
# No paid requests:
python3 scripts/benchmark.py

# Reads OPENROUTER_API_KEY, or an existing local pi OpenRouter credential.
# A new run spends more money; review the plan and budget first.
python3 scripts/benchmark.py --execute --run-id my-reviewed-run --cap-usd 3.50
```

Never put credentials in a browser bundle, committed environment file, command argument, or transcript. The collector persists conservative reservations before sending requests and does not automatically retry uncertain requests.

## Site structure

The page is a single static document with the following sections: hero and definitions; Figure 1, an engineering cross-section of the specified versus observed moat profile; the metric ribbon; the leaderboard with search, vendor and classification filters and sorting; the analysis section with Figure 2 (completion against completion tokens, computed from the dataset) and Figure 3 (editorial taxonomy from `annotations.json`); Track A, the text-only protocol; Track B, the proposed field protocol at Coogee Beach with the participation fee schedule and tiers; the reference class; and the footer. Dossiers open in a native dialog with the verbatim transcript, metadata, a before/after comparison and a staged observation timer.

Typefaces (Fraunces, IBM Plex Sans, IBM Plex Mono) are bundled from `@fontsource` packages and served from the site's own origin. The stylesheet imports them, so no font CDN is contacted.

## Configuration

`index.html` declares `window.MOATBENCH_CONFIG`:

| Key | Effect when set |
| --- | --- |
| `contactEmail` | The *Nominate a model* button becomes a mailto with a pre-filled nomination form. When empty, the button states that no correspondence address is published. |
| `siteUrl` | Copied dossier links use this canonical URL instead of the current page URL. |

Both are set: `siteUrl` to the GitHub Pages address and `contactEmail` to the owner's address. See [launch notes](LAUNCH_NOTES.md).

## Social card

`public/assets/social-card.png` is rendered from `scripts/social-card.html` against the built stylesheet; the rendering command is in that file's header comment. Re-render it after changing the hero copy or statistics.

## Editing

Edit the structured data to add a new sourced entry. To reclassify a transcript, edit `public/data/annotations.json`; keep the labels editorial and never present them as model output. Keep `null` for quantities that were not measured. Manufacturer bucket capacity, mine-production volume, and MoatBench completion are different metrics; never combine them into a fictitious ranking.

The site deliberately uses a narrow editorial voice. Keep the exact tagline, factual transcripts, tied ranks, sober captions and visible source links. Commerce and sponsorship integrations are absent.

## Rights

Application code is MIT licensed. Downloaded visual assets must be public domain or CC0, with evidence in the asset manifest; original project graphics are dedicated under CC0 as documented there. Manufacturer facts are cited without copying their protected photography or brochure designs. Model transcripts are service outputs and are not represented as licensed third-party stock images or guaranteed public-domain works.
