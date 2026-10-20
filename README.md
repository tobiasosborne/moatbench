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

The initial repository is private: [tobiasosborne/moatbench](https://github.com/tobiasosborne/moatbench).

The workflow verifies the evidence and builds `dist/` on every push. Deployment runs only when the repository Actions variable `PAGES_ENABLED` is `true`. GitHub rejected Pages activation for this private repository on the account's current plan; the source remains private. See [launch notes](LAUNCH_NOTES.md) for the exact activation steps after resolving that account limitation.

A private repository does not normally make a personal-account Pages website private; see [GitHub's hosting rules](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

## Data and provenance

| File | Purpose |
| --- | --- |
| `public/data/evaluations.json` | Successful transcripts, collection failures, protocol and run summary |
| `benchmark/runs/` | Sanitized API records, usage, timestamps, response hashes and budget ledger |
| `benchmark/models-snapshot.json` | Dated OpenRouter model catalogue used for the run |
| `benchmark/plan.json` | Explicit selected model IDs |
| `public/data/equipment.json` | Manufacturer specifications and external field-production figures |
| `public/data/assets.json` | Visual-asset source and public-domain licence records |
| `scripts/benchmark.py` | Budget-limited collector; dry run by default |
| `scripts/verify_data.py` | Offline integrity and budget checks |
| `scripts/package-evidence.mjs` | Generates the public downloadable evidence bundle before dev/build |

See [benchmark methodology](docs/BENCHMARK.md), [equipment sources](docs/EQUIPMENT.md), and [asset provenance](docs/ASSETS.md).

See [verification results and screenshots](docs/VERIFICATION.md) for the desktop/mobile browser checks.

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

## Editing

Edit the structured data to add a new sourced entry. Keep `null` for quantities that were not measured. Manufacturer bucket capacity, mine-production volume, and MoatBench completion are different metrics; never combine them into a fictitious ranking.

The site deliberately uses a narrow editorial voice. Keep the exact tagline, factual transcripts, tied ranks, sober captions and visible source links. Commerce and sponsorship integrations are absent.

## Rights

Application code is MIT licensed. Downloaded visual assets must be public domain or CC0, with evidence in the asset manifest; original project graphics are dedicated under CC0 as documented there. Manufacturer facts are cited without copying their protected photography or brochure designs. Model transcripts are service outputs and are not represented as licensed third-party stock images or guaranteed public-domain works.
