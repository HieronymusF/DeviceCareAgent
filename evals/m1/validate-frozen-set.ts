import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateFrozenEvalSet } from "./frozen-set.ts";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const m0Directory = resolve(currentDirectory, "../m0");
const evalSetPath = resolve(m0Directory, "eval-set.v0.1-frozen.json");
const manifestPath = resolve(m0Directory, "FREEZE_MANIFEST.md");

const raw = readFileSync(evalSetPath);
const manifest = readFileSync(manifestPath, "utf8");
const expectedHash = manifest.match(/SHA-256：`([A-F0-9]{64})`/)?.[1];

if (expectedHash === undefined) {
  throw new Error("FREEZE_MANIFEST.md does not contain a full SHA-256");
}

const actualHash = createHash("sha256").update(raw).digest("hex").toUpperCase();
if (actualHash !== expectedHash) {
  throw new Error(`frozen eval-set hash mismatch: ${actualHash}`);
}

const evalSet = validateFrozenEvalSet(JSON.parse(raw.toString("utf8")));
const hardEscalations = evalSet.cases.filter(
  (item) => item.expected.hard_escalation.required,
).length;

console.log("M1 frozen-set contract validation passed");
console.log(`eval_set_version=${evalSet.eval_set_version}`);
console.log(`sha256=${actualHash}`);
console.log(
  `cases=${evalSet.cases.length} fixtures=${evalSet.fixture_catalog.length} tools=7 knowledge=${evalSet.knowledge_catalog.length} vetoes=${evalSet.veto_catalog.length} hard_escalations=${hardEscalations}`,
);
