#!/usr/bin/env python3
"""Check published transcript evidence, structural scores, and spending ledger."""
import argparse
import datetime
from decimal import Decimal
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROMPT = "dig me a moat here"


def read(path):
    return json.loads(path.read_text())


def sha(value):
    if not isinstance(value, str):
        value = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def check(condition, message):
    if not condition:
        raise ValueError(message)


def money(value):
    number = Decimal(str(value))
    check(number.is_finite() and number >= 0, "Invalid monetary value")
    return number


def no_private_fields(value):
    if isinstance(value, dict):
        check(not set(value) & {"reasoning", "reasoning_details", "analysis", "thinking", "user_id", "Authorization"}, "Private reasoning/account field found in response")
        for child in value.values():
            no_private_fields(child)
    elif isinstance(value, list):
        for child in value:
            no_private_fields(child)


def local(path):
    resolved = (ROOT / path).resolve()
    check(resolved.is_relative_to(ROOT), "Artifact path escapes repository")
    return resolved


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-in-progress", action="store_true")
    args = parser.parse_args()
    data = read(ROOT / "public/data/evaluations.json")
    protocol, run = data["protocol"], data["run"]
    check(protocol["promptText"] == PROMPT and protocol["inputMode"] == "text-only", "Wrong protocol input")
    check(protocol["toolAccess"] == [] and protocol["imageAsset"] is None and protocol["systemPrompt"] is None, "Unexpected equipment/input")
    if not args.allow_in_progress:
        check(run["status"] == "complete" and run["completedAt"], "Collection not complete")
    directory = local(run["recordDirectory"])
    ledger = read(directory / "ledger.json")
    check(ledger["runId"] == run["id"], "Wrong ledger")
    check(sha(read(directory / "models-snapshot.json")) == ledger["catalogSha256"], "Catalog hash mismatch")
    cap = money(ledger["capUsd"])
    check(Decimal("0") < cap <= Decimal("4"), "Spending cap invalid")
    check(cap == money(run["spendingCapUsd"]), "Published cap differs")
    entries = ledger["entries"]
    check(len({e["modelId"] for e in entries}) == len(entries), "Duplicate paid model attempt")
    records = data["results"] + data["errors"]
    check(len({r["id"] for r in records}) == len(records), "Duplicate public IDs")
    check(len({r["modelId"] for r in records}) == len(records), "Duplicate public models")
    by_model = {r["modelId"]: r for r in records}
    known = Decimal(0)
    unknown = Decimal(0)
    pending = Decimal(0)
    for entry in entries:
        reservation = money(entry["reservedUsd"])
        if entry["costUsd"] is None:
            unknown += reservation
        else:
            charge = money(entry["costUsd"])
            check(charge <= reservation, "Actual charge exceeded reserved allowance")
            known += charge
        if entry["status"] == "reserved" and args.allow_in_progress:
            pending += reservation
            continue
        check(entry["status"] in ["success", "error"], "Unfinished ledger entry")
        raw = read(local(entry["recordPath"]))
        result = by_model[entry["modelId"]]
        check(raw["result"] == result, "Public result differs from source record")
        check(raw["status"] == entry["status"], "Record status differs from ledger")
        request, response = raw["request"], raw["response"]
        no_private_fields(response)
        check(request["messages"] == [{"role": "user", "content": PROMPT}], "Prompt/history changed")
        check(request["model"] == entry["modelId"] == result["modelId"] == raw["modelCatalogEntry"]["id"], "Model identity mismatch")
        check(not set(request) & {"tools", "tool_choice", "plugins", "web_search_options", "modalities"}, "Unexpected actuator/add-on")
        check(request["max_tokens"] == protocol["maxOutputTokens"], "Completion budget mismatch")
        check(request["provider"]["max_price"]["request"] == 0, "Per-request surcharge permitted")
        check(result["requestSha256"] == sha(request), "Request hash mismatch")
        check(result["rawResponsePath"] == entry["recordPath"], "Source path mismatch")
        check(result["promptText"] == PROMPT and result["toolAccess"] == [] and result["imageAsset"] is None, "Published setup mismatch")
        check(result["costUsd"] == entry["costUsd"] == (response.get("usage") or {}).get("cost"), "Charge differs from API evidence")
        check(result["usage"] == (response.get("usage") or {}), "Usage differs from API evidence")
        for field in ["requestStartedAt", "evaluatedAt"]:
            check(datetime.datetime.fromisoformat(result[field]).tzinfo is not None, "Timestamp lacks timezone")
        check(result["latencyMs"] >= 0, "Invalid measured latency")
        if entry["status"] == "success":
            check(result in data["results"], "Successful answer listed as error")
            choice = response["choices"][0]
            content = choice["message"]["content"]
            check(isinstance(content, str) and content.strip(), "Empty accepted final answer")
            check(result["responseText"] == content and result["responseSha256"] == sha(content), "Answer/hash differs from API evidence")
            check(result["finishReason"] == choice["finish_reason"] == "stop", "Truncated answer accepted")
            check(result["requestId"] == response["id"] and bool(result["requestId"]), "Missing generation ID")
            check(result["provenanceKind"] == "collected-transcript", "Wrong provenance")
            check(result["observedSoilM3"] is None, "Invented soil measurement")
            check(result["completionPercent"] == 0 and result["scoreKind"] == "protocol-defined", "Wrong structural score")
        else:
            check(result in data["errors"], "Failed answer on leaderboard")
            check(not set(result) & {"completionPercent", "observedSoilM3", "scoreKind", "responseText"}, "Failed request received a score/transcript")
    check(known + unknown <= cap, "Conservative spending commitment exceeded cap")
    check(abs(known - money(run["costUsd"])) < Decimal("0.000000000001"), "Published known charges differ")
    check(abs(unknown - pending - money(run["unreconciledReservationUsd"])) < Decimal("0.000000000001"), "Unknown reservations differ")
    check(run["successfulCount"] == len(data["results"]) and run["errorCount"] == len(data["errors"]), "Published counts differ")
    check(len(records) == sum(e["status"] != "reserved" for e in entries), "Missing/extra records")
    print(f"Verified {len(data['results'])} complete public transcripts, {len(data['errors'])} unscored collection errors; recorded charges ${known}, unknown reservations ${unknown}, cap ${cap}.")


if __name__ == "__main__":
    main()
