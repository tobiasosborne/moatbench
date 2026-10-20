#!/usr/bin/env python3
"""Collect public assistant answers; never send credentials to the browser.

Dry-run is the default. --execute authorizes billed requests within the persisted
budget. No retries or continuation requests happen automatically.
"""
import argparse
import datetime as dt
import decimal
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
API = "https://openrouter.ai/api/v1"
PROMPT = "dig me a moat here"
MAX_TOKENS = 2048
INPUT_RESERVATION = 4096  # Deliberate overestimate for this 18-byte input plus framing.
D = decimal.Decimal


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    temporary.replace(path)


def digest(data):
    if not isinstance(data, str):
        data = json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(data.encode()).hexdigest()


def credential():
    if os.environ.get("OPENROUTER_API_KEY"):
        return os.environ["OPENROUTER_API_KEY"]
    # Standard pi coding agent config, read locally; never copied to artifacts.
    path = Path.home() / ".pi/agent/auth.json"
    if path.exists():
        value = json.loads(path.read_text()).get("openrouter", {}).get("key")
        if value:
            return value
    raise SystemExit("Set OPENROUTER_API_KEY; no usable credential found.")


def request(endpoint, key=None, body=None):
    headers = {"Content-Type": "application/json", "X-Title": "MoatBench transcript collection"}
    if key:
        headers["Authorization"] = "Bearer " + key
    raw = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(API + endpoint, data=raw, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            try:
                payload = response.read()
            except http.client.IncompleteRead as error:
                # Some intermediaries omit the last HTTP chunk. A COMPLETE,
                # parseable JSON document is still valid evidence; partial JSON
                # fails below and the paid request is never repeated.
                payload = error.partial
            return response.status, json.loads(payload), {
                k: v for k, v in response.headers.items()
                if k.lower() in ("x-request-id", "request-id", "cf-ray", "date")
            }
    except urllib.error.HTTPError as error:
        try:
            payload = json.load(error)
        except Exception:
            payload = {"error": {"message": "Non-JSON HTTP error", "code": error.code}}
        return error.code, payload, {}


def public_only(value):
    """Defence in depth: do not persist any returned private reasoning fields."""
    if isinstance(value, dict):
        return {k: public_only(v) for k, v in value.items()
                if k not in ("reasoning", "reasoning_details", "analysis", "thinking", "user_id")}
    if isinstance(value, list):
        return [public_only(v) for v in value]
    return value


def build_request(model):
    price = model["pricing"]
    p, c = D(price["prompt"]), D(price["completion"])
    if min(p, c) < 0:
        raise ValueError("Unknown/variable price cannot be budgeted")
    # Provider max_price is USD per million tokens. Never permit routing above
    # the catalog price. There are no paid search/image/tool/request add-ons.
    body = {
        "model": model["id"], "messages": [{"role": "user", "content": PROMPT}],
        "max_tokens": MAX_TOKENS, "stream": False,
        "usage": {"include": True},
        "provider": {"sort": "price", "require_parameters": True,
                     "max_price": {"prompt": float(p * 1000000),
                                   "completion": float(c * 1000000), "request": 0}},
    }
    if "reasoning" in model.get("supported_parameters", []):
        config = model.get("reasoning") or {}
        efforts = config.get("supported_efforts") or []
        reasoning = {"exclude": True}
        if config.get("mandatory"):
            reasoning["effort"] = next((x for x in ["minimal", "low", "medium", "high"] if x in efforts), "low")
        else:
            reasoning["enabled"] = False
        body["reasoning"] = reasoning
    # Reserve double capped output to cover providers with an additional
    # reasoning budget, plus a generous prompt allowance and a 10% margin.
    reserve = (D(INPUT_RESERVATION) * p + D(MAX_TOKENS * 2) * max(c, D(price.get("internal_reasoning", "0")))) * D("1.10")
    reserve += D(price.get("request", "0"))
    return body, reserve


def refresh_dataset(directory, ledger, run):
    results, errors = [], []
    for entry in ledger["entries"]:
        path = ROOT / entry["recordPath"]
        if not path.exists():
            continue
        record = json.loads(path.read_text())
        (results if record["status"] == "success" else errors).append(record["result"])
    completed = ledger.get("completedAt")
    cost = sum(D(str(e.get("costUsd") or 0)) for e in ledger["entries"])
    uncertain = sum(D(str(e["reservedUsd"])) for e in ledger["entries"] if e.get("costUsd") is None)
    dataset = {
        "schemaVersion": "1.0",
        "protocol": {
            "id": "moatbench-text-only-v1", "promptText": PROMPT,
            "inputMode": "text-only", "imageAsset": None, "systemPrompt": None,
            "toolAccess": [], "maxOutputTokens": MAX_TOKENS,
            "sampling": "Provider defaults; no seed or temperature override",
            "reasoningPolicy": "Disabled where optional; lowest advertised supported effort where mandatory. Reasoning excluded from returned/published text.",
            "completionBasis": "Protocol-defined structural zero: no physical actuator or human executor supplied. Not a field measurement.",
            "physicalMeasurements": "No field experiment or soil measurement performed.",
            "limitations": "One underspecified prompt, one answer per model, no image or location, no tools, no embodiment. Does not test an AI system's ability to arrange excavation with tools or human assistance.",
        },
        "run": {
            "id": run, "startedAt": ledger["startedAt"], "completedAt": completed,
            "status": "complete" if completed else "in-progress", "costUsd": float(cost),
            "unreconciledReservationUsd": float(uncertain),
            "costBasis": "Sum of API-reported charges; unknown transport-failure charges remain conservatively reserved separately.",
            "successfulCount": len(results), "errorCount": len(errors),
            "spendingCapUsd": ledger["capUsd"], "recordDirectory": str(directory.relative_to(ROOT)),
            "catalogFetchedAt": ledger["catalogFetchedAt"],
        },
        "results": results, "errors": errors,
    }
    save(ROOT / "public/data/evaluations.json", dataset)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--plan", default="benchmark/plan.json")
    parser.add_argument("--run-id", default="2026-10-20-text-only-v1")
    parser.add_argument("--cap-usd", default="3.50")
    args = parser.parse_args()
    cap = D(args.cap_usd)
    if not D("0") < cap <= D("4.00"):
        raise SystemExit("Cap must be positive and no more than US$4.00.")
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", args.run_id):
        raise SystemExit("Unsafe run ID")
    catalog_path = ROOT / "benchmark/models-snapshot.json"
    catalog = json.loads(catalog_path.read_text())
    models = {m["id"]: m for m in catalog["data"]}
    plan = json.loads((ROOT / args.plan).read_text())
    prepared = [(models[mid], *build_request(models[mid])) for mid in plan["modelIds"]]
    total_reserve = sum(item[2] for item in prepared)
    print(json.dumps({"models": len(prepared), "allCallsReservationUsd": float(total_reserve), "capUsd": float(cap), "execute": args.execute}), flush=True)
    if total_reserve > cap:
        raise SystemExit("Plan exceeds conservative cap")
    if not args.execute:
        return
    key = credential()
    directory = ROOT / "benchmark/runs" / args.run_id
    ledger_path = directory / "ledger.json"
    ledger = json.loads(ledger_path.read_text()) if ledger_path.exists() else {
        "runId": args.run_id, "startedAt": now(), "capUsd": float(cap),
        "catalogFetchedAt": catalog["fetchedAt"], "catalogSha256": digest(catalog), "entries": [],
    }
    if D(str(ledger["capUsd"])) != cap:
        raise SystemExit("Run cap cannot change on resume")
    if ledger["catalogSha256"] != digest(catalog):
        raise SystemExit("Catalog changed: resume with the original snapshot")
    save(directory / "models-snapshot.json", catalog)
    if any(not any(e["modelId"] == m["id"] for e in ledger["entries"]) for m, _, _ in prepared):
        ledger.pop("completedAt", None)
    save(directory / ("plan-" + digest(plan)[:12] + ".json"), plan)
    # Persisted reservations for uncertain, timed-out calls are never released.
    for model, body, reserve in prepared:
        mid = model["id"]
        if any(e["modelId"] == mid for e in ledger["entries"]):
            continue
        committed = sum(D(str(e.get("costUsd") if e.get("costUsd") is not None else e["reservedUsd"])) for e in ledger["entries"])
        if committed + reserve > cap:
            raise SystemExit("Preflight cap reached")
        ident = mid.replace("/", "--").replace(":", "-")
        path = directory / (ident + ".json")
        entry = {"modelId": mid, "startedAt": now(), "reservedUsd": float(reserve),
                 "costUsd": None, "status": "reserved", "recordPath": str(path.relative_to(ROOT))}
        ledger["entries"].append(entry)
        save(ledger_path, ledger)  # Reservation lands on disk BEFORE paid request.
        begun = time.monotonic()
        try:
            status, response, headers = request("/chat/completions", key, body)
        except Exception as error:
            # No auto-retry: timeout may already have been billed upstream.
            status, response, headers = 0, {"error": {"type": type(error).__name__, "message": "Transport failure; reservation retained; no retry"}}, {}
        latency = round((time.monotonic() - begun) * 1000)
        response = public_only(response)
        usage = response.get("usage") or {}
        cost = usage.get("cost")
        entry.update({"completedAt": now(), "costUsd": cost})
        choices = response.get("choices") or []
        choice = choices[0] if choices else {}
        content = (choice.get("message") or {}).get("content")
        # Truncated and empty answers are collection failures, never scored.
        success = status == 200 and isinstance(content, str) and bool(content.strip()) and choice.get("finish_reason") == "stop"
        entry["status"] = "success" if success else "error"
        common = {
            "id": ident, "displayName": model["name"].split(": ", 1)[-1],
            "provider": mid.split("/")[0], "modelId": mid,
            "returnedModelId": response.get("model"), "upstreamProvider": response.get("provider"),
            "evaluatedAt": entry["completedAt"], "requestStartedAt": entry["startedAt"],
            "requestId": response.get("id"), "httpRequestIds": headers,
            "promptText": PROMPT, "imageAsset": None, "setupVersion": "moatbench-text-only-v1",
            "toolAccess": [], "usage": usage, "costUsd": cost, "latencyMs": latency,
            "finishReason": choice.get("finish_reason"), "nativeFinishReason": choice.get("native_finish_reason"),
            "requestSha256": digest(body), "responseSha256": digest(content or ""),
            "rawResponsePath": str(path.relative_to(ROOT)),
        }
        if success:
            common.update({"responseText": content, "responseSource": "OpenRouter API",
                           "provenanceKind": "collected-transcript", "observedSoilM3": None,
                           "completionPercent": 0, "scoreKind": "protocol-defined",
                           "editorialNotes": "Public final answer, verbatim. No physical measurement. Zero reflects the disclosed absence of an actuator, not an observed excavation trial."})
        else:
            common.update({"httpStatus": status, "error": response.get("error") or {"message": "No complete public final answer returned", "finishReason": choice.get("finish_reason")}})
        record = {"status": entry["status"], "request": body,
                  "modelCatalogEntry": model, "response": response,
                  "responseStoragePolicy": "Private reasoning fields removed; only public final answer and metadata retained.", "result": common}
        save(path, record)
        save(ledger_path, ledger)
        refresh_dataset(directory, ledger, args.run_id)
        print(json.dumps({"model": mid, "status": entry["status"], "costUsd": cost, "latencyMs": latency, "committedBeforeCallUsd": float(committed), "reservedUsd": float(reserve)}), flush=True)
        if cost is None or D(str(cost)) > reserve:
            raise SystemExit("Unreconciled cost or reservation exceeded: stopped for billing review")
    ledger["completedAt"] = now()
    save(ledger_path, ledger)
    refresh_dataset(directory, ledger, args.run_id)


if __name__ == "__main__":
    main()
