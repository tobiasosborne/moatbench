# Verification — 20 October 2026

## Second pass: design overhaul

After the redesign, the production build passed again with Vite 8.3.4 and `python3 scripts/verify_data.py` passed unchanged (54 accepted transcripts, 10 unscored errors, spending within cap). A script checked that every `href` and `src` in the built `dist/index.html` resolves to a file in `dist/`; none was missing.

Full-page renders were taken with headless Chromium against `vite preview` at 1440 px and 390 px, plus the open dossier at both widths: [desktop](preview-desktop.png), [mobile](preview-mobile.png), [field track](preview-field-track.png), [dossier](preview-dossier.png). Visual inspection confirmed the hero, Figure 1 drawing (including its scrollable presentation at phone width), metric ribbon, leaderboard table and its phone card layout, Figures 2 and 3, both protocol tracks, the fee schedule, the reference class, the footer, the dossier transcript with shovel highlighting, and the before/after comparison. Three layout defects found in the first render (a clipped title block, a stretched chart card, and a broken phone-width dossier button) were fixed and re-rendered.

This second pass did not re-run the earlier automated interaction suite or the axe scan; those results below describe the first build. Keyboard handling for the dialog (Escape via the native `cancel` event, focus return), the comparison slider (arrow, Home and End keys) and the observation timer were re-implemented and should be re-exercised in a browser before public launch.

## First pass

Production build passed with Vite 8.3.4. The offline data verifier confirmed all 54 accepted transcripts and 10 unscored errors, exact answer hashes and raw-record consistency, null physical measurements, and spending within the configured cap.

Automated Chromium checks ran against the production build served at `/moatbench/`, exercising:

- 360, 390, 768 and 1440 pixel widths without horizontal page overflow.
- All 54 results, first-page expansion/collapse, model search and vendor filtering.
- Exact full transcript display and result deep links.
- Modal opening, Escape closing and return of keyboard focus to the triggering button.
- Keyboard movement and endpoints of the before/after reference slider.
- Observation timer progress and pause.
- SVG result-card download, JSON dataset download, evidence bundle, clipboard URL.
- Local photograph loading and reduced-motion preference.
- No browser exceptions or failed asset requests.

The axe accessibility scanner reported zero violations in the main page and open dossier states. This automated check does not establish complete accessibility conformance.

Screenshots: [desktop](preview-desktop.png), [mobile](preview-mobile.png). Machine-readable check summary: [verification.json](verification.json).

The screenshots are original page renders using the documented CC0 photograph and original project graphics; they are review artifacts, not field observations.

An independent read-only audit checked the source records, Commons CC0 licence evidence, manufacturer field-report figures, secrets, budget accounting and deployment setup. Its two launch findings were resolved or documented: the private repository is no longer the public evidence link, and absolute social metadata remains a documented follow-up once a real production URL exists.

GitHub's Pages creation API returned HTTP 422 because the current plan does not support Pages for this private repository. This is a hosting-account limitation, not a passing deployment.
