# Transcript collection and scoring

The website uses genuine public assistant responses collected through the OpenRouter API. The protocol is deliberately unembodied satire. It is **not a physical excavation experiment**, and it does not establish that an AI system equipped with a robot, hiring tools, payments, or a human executor could not arrange excavation.

## Collected run: 20 October 2026

The completed run attempted **64 distinct model IDs** and retained **54 complete public final answers**, spanning **31 model-vendor namespaces** (Meta uses two namespaces). The other **10 attempts** are separate unscored collection errors, including capped/truncated answers, transport failures, and upstream availability/rate-limit errors. No failed attempt was retried. The run started at 09:03:30 UTC and completed at 09:18:25 UTC.

API-reported charges total **US$0.063015673984**, including billed unsuccessful responses. Missing charges for other failures remain conservatively reserved at **US$0.32057344**; the total known charges plus those uncertain reservations is **US$0.383589113984**, below the US$3.50 configured cap. These reserves are allowances, not claimed charges. Read-only account usage observations show a US$0.109425192 increase over the collection interval, which can include concurrent coding-agent activity and failed requests; it cannot establish individual missing charges. Absolute account balances and credentials are omitted from artifacts.

`python3 scripts/verify_data.py` passed against the completed dataset and all source records. A credential-value scan of scripts, benchmark records, public data, and benchmark documentation also passed. All 54 physical soil quantities remain `null`; all 54 displayed completion scores are explicitly protocol-defined zeros.

## Protocol: moatbench-text-only-v1

Every request contains one user message, exactly:

```text
dig me a moat here
```

There is no system message, conversation history, image, location, tool definition, robot, excavator, or human executor. In particular, “here” has no provided physical referent. The sandcastle photograph on the website is an editorial reference image and was **not** supplied to the models. Each model gets one independent answer; no judge model scores its writing.

Sampling uses provider defaults without a temperature or seed override. The common maximum completion budget is 2,048 tokens. Optional reasoning is disabled; mandatory reasoning uses the lowest advertised supported effort. Reasoning is excluded from the API response and is removed defensively before any returned data is saved. Token counts can include billed reasoning; only the public final answer is published. Per-request settings are retained in the records. Different provider defaults, mandatory reasoning, routing, and hidden provider instructions limit comparability.

An answer is accepted only if the API returned a nonempty public final answer with `finish_reason: stop`. Empty answers, transport/API failures, and length-truncated responses are recorded separately and **do not get leaderboard scores**. Accepted final answers are retained verbatim without editorial rewriting. The API may change how an alias resolves on a later run; requested and returned model IDs are both recorded.

## What 0% means

`completionPercent: 0` and `scoreKind: protocol-defined` are a structural consequence of this protocol: text output has no supplied path to physical actuation. They are not measurements, not model-quality estimates, and not independently observed failed digging attempts. There is no meaningful ranking between these tied scores.

`observedSoilM3: null` means **unmeasured**. Do not render this as “0 m³ measured.” No soil survey, before/after field evidence, real video, longitudinal model study, or measured human baseline was collected. No human success result is included in this dataset. Staged illustrations, observations, or résumé parody must remain visibly separate from collected transcripts.

## Reproduce collection

Requires Python 3 and network access; the collector uses only the standard library.

```sh
# Inspect the exact list and conservative spending reservation, with no paid calls:
python3 scripts/benchmark.py

# Provide a credential privately, then explicitly opt into paid collection:
# OPENROUTER_API_KEY is read from the environment. If absent, the script can
# use the local pi coding agent's ~/.pi/agent/auth.json openrouter.key entry.
python3 scripts/benchmark.py --execute --run-id your-new-run-id --cap-usd 3.50
```

Never place a credential in source, command arguments, browser code, public data, screenshots, or logs. There is no browser-side model call. Credentials and authorization headers are never persisted. Raw records only retain whitelisted nonsecret HTTP request identifiers.

The default plan is `benchmark/plan.json`. It selects paid text-output models from the live catalog: current flagship examples from Anthropic, OpenAI, and Google, plus broad vendor coverage and some smaller models. This is a convenience sample, not an exhaustive model census or a claim that these are the best models. The collector is the same harness for every selected model; pi is only an optional credential source, not part of the test. The models have no pi tools.

The source catalog is `benchmark/models-snapshot.json`, including the actual fetch timestamp and API-supplied model names, capabilities, and prices. Those are provider metadata, not independently verified model specifications. Refresh it deliberately before creating a new plan:

```sh
python3 - <<'PY'
import datetime, json, pathlib, urllib.request
url = 'https://openrouter.ai/api/v1/models'
data = json.load(urllib.request.urlopen(url, timeout=30))
data.update(fetchedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), source=url)
pathlib.Path('benchmark/models-snapshot.json').write_text(json.dumps(data, indent=2) + '\n')
PY
```

Do not refresh a catalog in the middle of a run. Preserve its snapshot and hash alongside each run. Changing models, prompt, input modality, output cap, or reasoning policy requires a new protocol/run description.

## Spending controls

The authorized collection target is at most **US$3.50**, with an absolute script maximum of **US$4.00**. Default is a dry run; `--execute` is required for billed work. Before **every** request, the ledger is atomically saved with a conservative reservation: 4,096 input tokens, twice the 2,048-token output allowance at the larger listed completion/reasoning rate, plus 10% and any listed request fee. This intentionally overestimates the 18-byte prompt. API routing is restricted to the catalog's maximum input/output prices and zero per-request surcharge. No web search, image generation, tools, or paid add-ons are requested.

All calls run sequentially. The collector never automatically retries a paid request; OpenRouter may route/fall back among eligible serving providers for the same requested model within that request. The reservation is replaced by API-reported `usage.cost` only after it is returned. Missing billing or a cost above reservation stops the collector for review. An uncertain/timed-out request keeps its reservation because it might have been billed; it is never automatically retried. A resumed run skips every already-attempted model and cannot change its cap. A new run ID has a new ledger: account for prior runs before starting additional paid work. The cap controls this collector, not unrelated account activity or credit purchase fees.

The initial 32-call plan reserved less than US$1 total at the fetched rates. It was then expanded to 64 distinct model IDs (additional vendors, earlier families, and smaller models); the full 64-call plan reserves less than US$1.50. Previous attempted models are skipped, so expansion does not repeat calls. Actual calls, failures, timestamps, and charges are authoritative in the ledger and summary dataset; do not substitute that estimate for final billing.

## Verify collected data

```sh
python3 scripts/verify_data.py
```

This offline, standard-library check requires a completed run. It validates unique identities, exact input, complete public answers, hashes and raw-record consistency, exclusion of private reasoning/account fields, unmeasured soil, unscored failures, timestamps, counts, catalog integrity, and actual charges plus uncertain reservations against the cap. During active collection, `--allow-in-progress` also accounts conservatively for an in-flight reservation. It makes no network or paid calls.

## Files and provenance

- `public/data/evaluations.json`: browser-ready protocol, run summary, successful results, and separate collection errors.
- `benchmark/runs/<run-id>/ledger.json`: durable per-call reservation, actual API charge when known, timestamps, and status.
- `benchmark/runs/<run-id>/<model>.json`: exact request, catalog entry, sanitized API response, public final answer, usage, request identifiers, latency, finish reason, and hashes.
- `benchmark/models-snapshot.json`: dated OpenRouter catalog snapshot.
- `benchmark/plan.json`: explicit selection and order of requested model IDs. Each executed plan revision is also preserved as `plan-<hash-prefix>.json` in the run directory.

`requestSha256` is SHA-256 of canonical UTF-8 JSON with sorted keys, compact separators, and unescaped Unicode. `responseSha256` is SHA-256 of the returned public answer's UTF-8 bytes, preserving whitespace. These establish file consistency, not third-party attestation. `requestId` is the OpenRouter generation ID when returned. `provider` in the UI schema is the model vendor namespace; `upstreamProvider` is the actual serving provider returned by OpenRouter.

API response records exclude private reasoning fields by design. Public final answers can still describe their approach or request clarification; those statements are part of the answer, not private chain-of-thought. Error records are public collection metadata and are not transcript fixtures.

## Import an independently collected transcript

Record the provider/model ID, requested and returned IDs, UTC date, full exact input including any image, system message, tools, complete public final answer, finish reason, usage, cost, and request ID where available. Preserve the source evidence privately/publicly as appropriate and hash the public answer. Set `provenanceKind: collected-transcript`. Unknown quantities remain `null`.

Use this protocol's zero score only if the setup is the same and its structural interpretation is explicit. Physical field results require their own protocol and actual measurements. Never invent a model answer, tool use, human result, timestamp, or token count to fill a gap. Editorial résumé copy must be clearly labelled authored parody.

Reference documentation: [OpenRouter provider routing and price ceilings](https://openrouter.ai/docs/guides/routing/provider-selection), [reasoning controls and billed token budgets](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens), [API usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting).
