# Launch state — 20 October 2026

## Delivered

- Private repository: https://github.com/tobiasosborne/moatbench
- Static Vite site with responsive leaderboard, 54 verbatim model transcripts, filtering, sorting, dossiers, reference-image comparison, staged observation timer, share-card export, and dataset/evidence downloads.
- 64 distinct model attempts, with 10 collection failures preserved and unscored.
- Sourced specifications from Caterpillar, Komatsu, Liebherr, Bully Tools and Fiskars; manufacturer-reported actual mine production presented separately.
- Verified CC0 reference photograph and original CC0 favicon/social artwork. See `docs/ASSETS.md`.
- Reproducible collector, budget ledger, sanitized response records, integrity verifier and GitHub Actions build.

## GitHub Pages account blocker

The GitHub REST API rejected `POST /repos/tobiasosborne/moatbench/pages` with HTTP 422:

> Your current plan does not support GitHub Pages for this repository.

The repository remains private as requested. No public website has been deployed. GitHub Pages supports private source repositories on qualifying paid plans; personal-account Pages sites are normally publicly accessible even when their source is private. See [GitHub documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

After the owner either enables a qualifying plan or explicitly chooses a public repository, activate Pages:

```sh
gh api --method POST repos/tobiasosborne/moatbench/pages -f build_type=workflow
gh variable set PAGES_ENABLED --repo tobiasosborne/moatbench --body true
gh workflow run pages.yml --repo tobiasosborne/moatbench
```

The workflow already builds on every main-branch push; its deployment job is gated by `PAGES_ENABLED`, so the account limitation does not create a failing initial build. Its artifact can be downloaded from the private Actions run.

Once GitHub returns the actual deployed URL, set absolute `og:image`, `og:url`, and canonical metadata in `index.html`. The current relative social image works in local previews but is not a guaranteed social-crawler preview. Do not claim an unverified production URL is live.

## Evidence and spending

Recorded API charges: US$0.063015673984. Retained reservations for uncertain charges: US$0.32057344. Conservative collection commitment: US$0.383589113984 against a US$3.50 collection cap. Observed account usage increase: US$0.109425192, which can include concurrent coding and failed-request billing; it is not added to per-call charges.

`public/data/evidence.json` is generated before dev/build and includes sanitized request/response records, the catalogue snapshot, ledger, metadata, collector, verifier and methodology. No key, authorization header, account balance or private reasoning is included. The download remains available independently of private GitHub access.

## Interpretation

No MoatBench physical field experiment occurred. Text-only model scores are structural zeros; soil measurements are unknown. External mine production is manufacturer-reported and is not a MoatBench score. A real matched shovel-versus-model field experiment would require physical equipment, operators, a separate protocol and actual measurements.

The CC0 sandcastle is a rough, fairly elaborate drip castle. It was selected over inaccessible or incompatibly licensed stock photos. A modest original pail-castle photograph would improve the art direction later, but is not needed to use this version.

## Naming and integrations

The handoff identifies an unrelated security evaluation named MoatBench in the OpenMoat project. This release makes no originality or trademark claim. No domain has been purchased. No sponsor relationship, checkout, tip jar, analytics, email capture or monetisation account is configured.

## Implementation

Four GPT-6.1 Sol subagents handled frontend, model evaluation, asset research and independent audit. No Astra subagent was used. The coding agent `pi` generated the substantial frontend through OpenRouter's DeepSeek V4 Flash, followed by integration, accessibility corrections and browser QA. The benchmark's Astra entry is a tested model response, not a coding subagent.
