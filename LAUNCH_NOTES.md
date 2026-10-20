# Launch state — 20 October 2026

## Delivered

- Public repository: https://github.com/tobiasosborne/moatbench · live site: https://tobiasosborne.github.io/moatbench/
- Static Vite site with responsive leaderboard, 54 verbatim model transcripts, filtering, sorting, dossiers, reference-image comparison, staged observation timer, share-card export, and dataset/evidence downloads.
- 64 distinct model attempts, with 10 collection failures preserved and unscored.
- Sourced specifications from Caterpillar, Komatsu, Liebherr, Bully Tools and Fiskars; manufacturer-reported actual mine production presented separately.
- Verified CC0 reference photograph, the owner's own Coogee Beach site photograph, and original CC0 favicon/social artwork. See `docs/ASSETS.md`.
- Reproducible collector, budget ledger, sanitized response records, integrity verifier and GitHub Actions build.

## Design overhaul and field track — 20 October 2026, second pass

- Full visual redesign: self-hosted Fraunces / IBM Plex type system, sand-paper palette, engineering cross-section (Figure 1), verbosity-versus-completion scatter (Figure 2), editorial response taxonomy (Figure 3), restyled dossiers and a new social card.
- New **Track B field protocol** section: evaluation at an undisclosed location (Coogee Beach, Sydney), a six-step field procedure, three tiers, and a **US$10,000 per-model participation fee** itemised as evaluator business-class transit, five-star accommodation, bucket and spade, sunscreen and flat whites. The page discloses that no laboratory has nominated a model, no field evaluation has occurred, and the fee is a proposal.
- The owner's own Coogee Beach photograph is used as the site-survey banner with EXIF and GPS stripped; see `docs/ASSETS.md`.
- `public/data/annotations.json` holds the editorial classification of each transcript's primary move. It is authored, not generated, and does not affect scores.

### Inputs still needed before launch

- **Nomination contact.** `window.MOATBENCH_CONFIG.contactEmail` is set to the owner's address (20 October 2026); the *Nominate a model* button is a mailto with a pre-filled nomination form.
- **Payment.** No payment destination exists. The fee schedule is copy. If a laboratory ever wants to pay, that is a separate, manual arrangement; nothing on the site simulates checkout.

## Publication — 20 October 2026

On the owner's instruction the repository was made public and GitHub Pages was created with `build_type: workflow`. The Actions variable `PAGES_ENABLED` is `true`, so every push to `main` builds, verifies the data and deploys.

- Site: https://tobiasosborne.github.io/moatbench/
- `og:url`, absolute `og:image`, canonical link and `MOATBENCH_CONFIG.siteUrl` in `index.html` point at that URL.

The earlier HTTP 422 from the Pages API was a private-repository plan limitation and no longer applies.

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
