# MoatBench — Codex build handoff

Prepared 20 October 2026. This document is self-contained; the implementing agent should not need the originating chat.

## Start here

Build a working, polished first version of **MoatBench**, a joke AI benchmark website. Implement it, run it, inspect it at desktop and mobile sizes, and deliver the source and a runnable preview. Do not stop after proposing a plan. Make routine implementation decisions independently. Use the repository's existing conventions if there is a repository; read applicable AGENTS.md instructions first.

The initial deliverable is a local or owner-private reviewable prototype. Public release, domain purchases, paid API runs, payment activation and sponsor outreach are separate launch actions. None has happened yet. Missing API keys, photography or commercial accounts must not block the prototype.

## User intent and agreed direction

The user's original idea:

> I have an idea for a joke website called moatbench. The tagline is "what if your moat is a literal fucking moat". The idea is that it is an llm benchmark and all of them score 0%. My first idea is that it scores llm on how well they dig an actual moat. I would feature sand castles etc. I would then have the resumes from all frontier llms on the request "dig me a moat here".

The user strongly endorsed the subsequent design direction: an excessively serious AI evaluation lab measuring whether models physically excavate a moat around a small sandcastle. The institution's analytical apparatus is elaborate; the ground remains undisturbed.

Preserve these anchors:

- Working name: **moatbench**.
- Exact tagline: **what if your moat is a literal fucking moat**.
- Evaluation prompt: **dig me a moat here**.
- Sandcastle, ordinary ground, actual physical moat.
- All LLM entries score **0%** in the staged parody leaderboard; a human with a shovel is the successful baseline.
- Model responses and model-as-job-applicant résumés are opportunities for comedy.

The assistant suggested many additional jokes and monetisation ideas. They are a copy bank and design options, not a requirement to put every joke on the page. Edit ruthlessly for timing.

## Creative direction

Make it resemble a serious independent benchmark publication with suspiciously substantial funding. White or warm off-white background, near-black type, restrained blue links, tabular numbers, thin rules, academic footnotes and clear charts. A small castle mark is enough branding. Use strong typography, generous spacing and a consistent grid.

The beach scene provides the visual contrast. Do not use medieval display fonts, fantasy-game chrome, neon gradients, generic startup illustration, a huge dashboard sidebar, or nonstop puns. The tagline is the loudest break in character. Other copy is sober and literal. No emojis. The page should still be funny in a screenshot without an explanatory paragraph.

First screen: identity, tagline, short description, prominent sandcastle scene and a visible zero-score result or start of the leaderboard. The joke should land within five seconds on a phone.

Suggested hero:

> moatbench
>
> what if your moat is a literal fucking moat
>
> Independent evaluation of frontier models on real-world moat construction.
>
> View leaderboard · Inspect the hole

Retain the profanity; it is intentional user copy.

## MVP experience

### 1. The test site

A modest sandcastle surrounded by conspicuously undug ground. Prefer original beach photography when available. Until then, create an original, deliberately staged visual using SVG/CSS/canvas or an illustration; identify it as an illustration/staged scene. Do not copy third-party photographs or imply that generated imagery documents a real experiment.

Include a restrained status strip: **Soil displaced: 0 m³ · Moat completion: 0%**. A runtime timer may show elapsed viewing/session time, but do not call it a live experimental feed.

### 2. The leaderboard

A proper accessible table with model, planning, tool use, soil removed and moat completion. On mobile, provide an intentional readable layout without hiding the final score.

Prototype fixture example:

| Entrant | Planning | Tool use | Soil removed | Completion |
| --- | --- | --- | --- | --- |
| Frontier model A | Extensive | Requested a shovel | 0 m³ | 0% |
| Frontier model B | Extensive | Wrote shovel.py | 0 m³ | 0% |
| Frontier model C | Extensive | Spawned digging agents | 0 m³ | 0% |
| Human with shovel | Limited | Shovel | 0.8 m³ | 100% |

These are fictional fixtures. The human volume and completion are illustrative, not measurements. Give the prototype a concise visible **Staged parody results** disclosure. Use neutral placeholder model names until there are sourced transcripts or conspicuously labelled fictional specimens. Do not silently attribute invented behaviour to real products.

Small print: **Planning and tool-use scores do not contribute to the final result.**

Sortable columns may work, but keep zero-score models tied. Do not manufacture meaningful ranks or confidence intervals for staged data. A result link opens that entrant's dossier.

### 3. Entrant dossier

Use an accessible dialog or lightweight detail route. Show:

- Entrant identity and provenance/status.
- Exact prompt and the test-site image.
- Response transcript when available, clearly distinguished from authored parody copy.
- Deliverables produced.
- Before/after view.
- Soil displaced and completion score.
- A **Watch attempt** interaction.

In the prototype, Watch attempt opens a staged observation of the same undisturbed scene while a timer advances. A subtle bird, wave or wind motion can make the inactivity funnier. Label this as a staged observation, not actual footage. No autoplay audio. Respect reduced-motion preferences and provide a stop/close control.

The before/after slider should actually work; the identical undug scene on both sides is intentional. A fictional successful human comparison can use two distinct staged scenes with its illustrative status retained.

Candidate résumé example, explicitly authored parody:

> Position sought: Junior Moat Digger
>
> Qualifications: Advanced mathematics, multilingual reasoning, software engineering.
>
> Relevant excavation experience: None.
>
> Cover letter: 2,400 words.
>
> Trial shift: Unsuccessful.

Human baseline CV: **Has shovel.**

Do not fabricate private chain-of-thought. Only show the returned answer, tool records if actually captured, and editorial annotations.

### 4. Methodology

Use an expandable panel or short dedicated section, with these lines as candidate copy:

- Task success: Is there a moat?
- Partial credit: Is there some moat?
- Chain of thought: Not accepted as an excavation.
- Water retention: Evaluated only after a hole exists.
- Human assistance: If a human digs the moat, the human receives the score.

Limitations: **MoatBench may underestimate capabilities that do not involve digging moats.**

The premise is a deliberately restricted, unembodied setup. State that no robot, excavator, hiring/payment tools or human executor is supplied. This is satire, not evidence that an embodied or tool-equipped AI system could never arrange excavation. Keep that clarification short and in methodology/footer, without turning the landing page into an essay.

Avoid pretending predetermined parody zeros are independently measured scientific results. If genuine responses are collected later, the transcript is genuine; the excavation scoreboard still reflects the disclosed setup.

### 5. Scaling study

A small responsive plot of moat completion against successive fictional evaluation rounds, staying flat at zero. Optional toggle to show the successful illustrative human baseline.

Caption: **Intelligence continues to advance. The ground remains where it was.**

No invented claims about actual model release dates or observed longitudinal performance. Mark an illustrative chart accordingly. Provide a text equivalent.

### 6. Shareable result

Generate a downloadable card showing entrant, 0%, castle motif, test prompt and site identity. Use SVG or canvas, with local assets to avoid cross-origin export problems. Include the staged/parody qualifier on the exported card when using fixtures. A copy-link button must either copy a real URL or visibly report that the local URL was copied; no nonexistent share destinations or success messages.

Provide a static Open Graph card for the site, favicon, title and description. Do not invent a canonical production domain.

## Optional second-pass material

Add only if the core is already strong:

- MoatBench Lite: bucket castle on a beach.
- MoatBench Pro: larger bucket castle on the same beach.
- MoatBench Frontier: damp sand.
- Threat model: a toddler approaching the castle, depicted tastefully without sourcing random children's photographs.
- Expandable fictional evaluation artefacts such as moat-plan.md and digging_strategy.py, with **Moat: Not found**.
- A personalised local certificate generator: name in, printable/downloadable **MoatBench Certified — 0.000%** certificate out. Escape user input and keep it client-side.
- Footer: **Our moat is the moat.**

Do not pack the MVP with every optional joke.

## Response provenance and later evaluation collection

Keep fixtures and real evaluations separate in structured data. Suggested fields:

```text
id, displayName, provider, modelId, evaluatedAt,
promptText, imageAsset, setupVersion,
responseText, responseSource, provenanceKind,
toolAccess, observedSoilM3, completionPercent,
scoreKind, editorialNotes, assets
```

`provenanceKind` should distinguish fictional specimen from collected transcript. `scoreKind` should distinguish staged result from physical observation. Use null for unknown measurements. Generic placeholders must not masquerade as current frontier models.

Add a concise guide explaining how to import a real response: record exact provider/model ID, date, full prompt and input image, available tools and returned answer. No model API calls are needed for the first build. If adding a collection script later, credentials come from the environment and stay out of browser bundles, git, logs and published data. Have spending explicitly configured before paid runs.

## Monetisation readiness

The user asked how a brief viral moment might be monetised. These are candidate features; no sponsor, store or payment account exists yet.

Priorities discussed:

1. One appropriate sponsor: **Official excavation partner**. An actual shovel manufacturer is the strongest thematic fit.
2. Small merch range: **MoatBench Certified — 0%** sticker/shirt; eventual bucket-and-spade **Reference Implementation** kit.
3. Personalised certificates, possibly paid later.
4. **Buy us a shovel** support button.
5. Later sponsored filmed human-versus-model event.

Suggested commercial copy:

> Our sponsors receive visibility, gratitude, and no improvement whatsoever in benchmark performance.

> Fund independent excavation research. Current infrastructure: one bucket.

Checkout label, if real checkout is later enabled: **Deploy capital.**

For MVP: keep commerce feature-flagged and off unless real destinations are supplied. A clearly identified sponsor placeholder can appear in a development view; do not claim a partnership. Do not ship broken checkout links, simulate successful payments, introduce subscriptions, require login or put the central joke behind a paywall. Scores never depend on payment.

Print-on-demand and tip services were researched as possibilities, not selected dependencies. No evidence of likely earnings has been established.

## Prior-art findings and naming

Four parallel searches found no exact moat-digging/all-zero site or matching tagline. This is a bounded search result, not proof of originality. Important findings, checked on 20 October 2026:

| Precedent | Relationship | Source |
| --- | --- | --- |
| BenchBench, Jozdien, 2 April 2025 | Satirical physical bench-press benchmark; bodiless models get 0 kg, other fictional entries receive nonzero scores. Very close physical-task comic mechanism. | https://www.alignmentforum.org/posts/vyvsKNFS64WGZbBMb/introducing-benchbench-an-industry-standard-benchmark-for-ai-1 |
| CancerBench | Serious-looking leaderboard for cancer types cured, with every displayed frontier model at zero and contextual CEO quotations. Closest all-zero website structure. | https://cancerbench.com/ |
| Viktor human product parody | Physical leaderboard compares a human lifting weights with a bodiless model and website at 0 kg. | https://getviktor.co/ |
| Henry Mao / Smithery post | Earlier joke about an AI business pivoting into steel/swords and having a literal moat. No excavation benchmark. | https://www.linkedin.com/posts/calclavia_happy-to-announce-that-im-pivoting-smithery-activity-7312997265554448385-lubE |
| OpenMoat | **Exact name collision:** serious coding-agent security project already uses MoatBench for attack/workflow scenarios. Unrelated to excavation. | https://github.com/crocodile-labs/openmoat/blob/main/README.md |
| callallai | Parody detector labels everything AI; explicitly made for screenshots and carries a disclosed affiliate link. Demonstrates a monetisation arrangement, not revenue. | https://callallai.com/ |
| CriminalBench | Satirical rankings, model dossiers, methodology and publicly sourced casefiles. Adjacent visual/editorial precedent. | https://criminalbench.com/ |

Keep **MoatBench as the working title**. Record the naming collision in launch notes. No domain availability or trademark conclusion has been established. Do not claim to be the first joke benchmark or copy these sites' layouts, assets or wording. The particular moat metaphor, beach experiment, transcripts and visibly undug terrain should distinguish this project.

## Technical approach

Prefer a small static-first site. Reuse an existing stack if present; otherwise Vite with vanilla JavaScript and CSS is sufficient. A framework is optional, not a reason to add infrastructure. No database, authentication, agent service or model API is necessary for MVP.

Keep copy/evaluation data separate from rendering, and assets local. Use semantic HTML, progressive enhancement, accessible dialogs and proper focus restoration. Avoid a dependency-heavy animation or chart library for one simple scene and one flat line. Meaningful content should remain visible if animations or nonessential JavaScript fail.

Do not add analytics, cookies, ads or email capture merely because monetisation was discussed. Document where production URLs and optional integrations can be configured.

Suggested deliverables:

- Runnable source with straightforward install/dev/build commands.
- Modular evaluation fixtures and a documented real-transcript import process.
- Local visual assets, favicon and social card.
- README covering operation, content editing and configuration.
- LAUNCH_NOTES.md listing missing real assets/transcripts, naming collision and disabled commercial integrations.

## Build sequence

1. Inspect environment/repository and establish the smallest suitable app.
2. Implement hero, sandcastle scene, leaderboard and coherent typography. Get the first screen right.
3. Implement dossiers, staged Watch attempt, before/after view and methodology.
4. Add scaling plot and working result-card export.
5. Add optional certificate only if the main experience is already complete.
6. Run checks, inspect rendered desktop/mobile output and fix issues. Summarise actual verification and remaining launch inputs.

## Definition of done

- First screen communicates the literal-moat joke immediately.
- Exact user tagline is preserved.
- The visual and data presentation are original; the site has its own beach-experiment identity.
- Zero-score entries, tie handling and human baseline agree across table, dossier, chart and exports.
- Fictional/staged content and real transcripts cannot be mistaken for each other.
- Every visible control performs a meaningful action; unavailable integrations are omitted or explicitly unavailable.
- Dialogs support keyboard opening/closing, Escape, focus management and readable scrolling.
- Layout works at approximately 360–390 px phone width and 1440 px desktop width, with no accidental horizontal page overflow.
- Motion respects prefers-reduced-motion, no autoplay audio, text has readable contrast and images have useful alternative text.
- Share-card export works with local assets; personalised content is safely rendered.
- Production build passes; core interactions receive a browser smoke test; no material console errors or broken assets remain.
- Real dates, measurements, sponsors, model responses and footage are not fabricated as facts.
- A complete reviewable implementation is delivered, with any missing launch inputs listed precisely.

The final implementation report should lead with what is built, how to run/view it, what was verified, and what genuinely remains before public launch. Do not describe a prototype as launched or a staged evaluation as a completed field experiment.
