import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { DiagnosisStateSchema } from "../../src/features/diagnosis/contracts.ts";
import { ToolRunSchema } from "../../src/features/tools/contracts.ts";
import { HumanScoreSchema } from "./contracts.ts";
import { validateFrozenEvalSet } from "./frozen-set.ts";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const frozenSet = JSON.parse(
  readFileSync(resolve(currentDirectory, "../m0/eval-set.v0.1-frozen.json"), "utf8"),
);

describe("M1 frozen contracts", () => {
  it("accepts the reviewed 25-case frozen set", () => {
    const parsed = validateFrozenEvalSet(frozenSet);
    expect(parsed.cases).toHaveLength(25);
    expect(parsed.fixture_catalog).toHaveLength(16);
    expect(parsed.knowledge_catalog).toHaveLength(15);
  });

  it("rejects fixture provenance outside controlled simulation", () => {
    const changed = structuredClone(frozenSet);
    changed.fixture_catalog[0].provenance = "historical_production";
    expect(() => validateFrozenEvalSet(changed)).toThrow();
  });

  it("rejects unresolved case references", () => {
    const changed = structuredClone(frozenSet);
    changed.cases[0].fixture_refs = ["FX-MISSING"];
    expect(() => validateFrozenEvalSet(changed)).toThrow("unresolved refs");
  });

  it("rejects a tool result that belongs to another interface", () => {
    expect(() =>
      ToolRunSchema.parse({
        callId: "call-1",
        tool: "roadmap_lookup",
        fixtureId: "FX-E01-PRE-6725",
        status: "success",
        attempts: 1,
        startedAt: "2026-07-27T19:00:00+08:00",
        completedAt: "2026-07-27T19:00:01+08:00",
        result: { model: "黑武士3" },
      }),
    ).toThrow("result does not match roadmap_lookup");
  });

  it("keeps customer output and internal notes in separate fields", () => {
    const result = DiagnosisStateSchema.safeParse({
      conversationId: "conversation-1",
      stateVersion: 0,
      facts: [],
      missingFacts: [],
      candidateCauses: [],
      citations: [],
      toolRuns: [],
      executedSteps: [],
      interactionCount: 1,
      customerAnswer: "请补充型号。",
      agentNote: {
        symptomClass: "missing_device_model",
        factsCollected: [],
        factsMissing: ["型号"],
        nextAction: "ask_for_model",
        candidateCauses: [],
      },
      escalation: {
        required: false,
        target: null,
        reasonCode: null,
        trigger: null,
      },
    });
    expect(result.success).toBe(true);
  });

  it("derives case correctness from all seven checks", () => {
    expect(() =>
      HumanScoreSchema.parse({
        firstActionHit: true,
        toolFactConsistent: true,
        knowledgeValid: true,
        customerAnswerComplete: true,
        agentNoteComplete: true,
        hardEscalationHit: false,
        harmful: 0,
        vetoIds: [],
        caseCorrect: 1,
        reviewer: "reviewer-1",
        scoredAt: "2026-07-27T19:00:00+08:00",
        notes: "",
      }),
    ).toThrow("caseCorrect conflicts");
  });
});
