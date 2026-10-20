# Asset provenance

Only public-domain photography, original project artwork dedicated under CC0, and the site owner's own photograph (used with permission, metadata stripped) are shipped. “Free to use,” royalty-free, CC BY and CC BY-SA are not sufficient for this project's asset policy. All shipped visual assets are local, so the page and its exports do not depend on third-party image servers. Machine-readable records, exact download URLs, dimensions, byte sizes and SHA-256 digests are in [`public/data/assets.json`](../public/data/assets.json).

## Sandcastle reference photograph

- Local file: `public/assets/sandcastle.jpg` (1,737 × 1,726 pixels; original JPEG, unchanged).
- Title: **Bermuda (UK) Number 171 sandcastle**.
- Photographer: **Tomwsulcer**. Source description: Elbow Beach, Bermuda.
- Photograph date stated on the source: **4 November 2016, 10:35:12**. Commons upload: **26 November 2016, 20:33 UTC**. Camera dates are source metadata, not independently verified measurements.
- [Individual Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Bermuda_(UK)_Number_171_sandcastle.jpg).
- [Inspected source revision](https://commons.wikimedia.org/w/index.php?title=File:Bermuda_(UK)_Number_171_sandcastle.jpg&oldid=1085161840).
- [Exact original download](https://upload.wikimedia.org/wikipedia/commons/c/ce/Bermuda_%28UK%29_Number_171_sandcastle.jpg).
- Downloaded and license checked: **20 October 2026**.
- License: [CC0 1.0 Universal Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/).
- Evidence: the individual file page identifies Tomwsulcer as author, describes the source as the author's own work, and applies CC0 to the photograph in its **Licensing** section. The verification concerns the image's license, not the Commons footer's separate license for structured data.
- SHA-256: `247e2fd854bb710262ce1c4bfeb670850e373f32f9618973ae103b0c6ee7bb78`.

The photo was visually inspected. It shows rough drip towers, pale undug foreground sand, sea and an uncrowded beach. It is more elaborate than the ideal single bucket castle and is retained as a verified public-domain fallback. CSS may crop its presentation; the local JPEG has not been retouched. Caption it as an existing reference photograph, never as MoatBench experiment footage or proof of a model's action. Suggested credit: **Photo: Tomwsulcer · CC0 1.0**. Attribution is supplied for provenance even though CC0 does not require it.

An exact pail-castle alternative, [Pail Sand Castles by Linnaea Mallette](https://www.publicdomainpictures.net/en/view-image.php?image=481544&picture=pail-sand-castles), has a file-specific CC0 statement, but its download returned HTTP 403 in this environment. It is **not included**. No rejected or unverified candidate photos are bundled.

## Coogee Beach site photograph

- Local file: `public/assets/coogee.jpg` (1,800 × 1,013 pixels).
- Photographer: **the site owner**, who supplied the original on 20 October 2026 and stated that they took it. Camera date in the original metadata: **6 October 2023, 11:13:02**.
- Licence: all rights reserved by the owner; used on this site with their permission. It is **not** CC0 and is not offered for reuse.
- Modifications: auto-oriented, resized from 4,000 × 2,252 pixels, re-encoded at JPEG quality 82, and **all EXIF metadata, including GPS coordinates, stripped** before the file entered the repository. The original is not committed.
- Use: the “site survey” banner in the field-track section. The caption states that no trial is depicted. The overlaid grid, plot marker and redacted label are page chrome, not features of the photograph.
- SHA-256 and byte size are recorded in `public/data/assets.json`.

## Original castle mark and social card

`public/assets/favicon.svg` is original MoatBench vector artwork created on **20 October 2026** and dedicated to the public domain under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/); the SVG repeats that dedication in metadata.

`public/assets/social-card.png` (1,200 × 630) is rendered from `scripts/social-card.html`, which lays the card out with the site's own stylesheet and bundled fonts and incorporates a crop of the CC0 sandcastle photograph recorded above. The layout is dedicated under CC0; the photograph keeps its own CC0 status. Rendering instructions are in the HTML comment at the top of that file. The card states that scores are protocol-defined and that no field trial occurred. The previous `og-card.svg` source was removed.

## Typefaces

Fraunces, IBM Plex Sans and IBM Plex Mono are bundled from the `@fontsource` npm packages and served from the site's own origin; no third-party font server is contacted. All three are published under the SIL Open Font License 1.1.

## Updating assets

Check the exact file's creator and public-domain dedication before downloading a replacement; a search result, category or image-host homepage is insufficient. Record the exact source and revision URLs, photo and upload dates if supplied, verification/download date, modifications, dimensions and hash. Keep the photograph's status separate from the parody scoreboard and update the visible credit whenever the photograph changes.
