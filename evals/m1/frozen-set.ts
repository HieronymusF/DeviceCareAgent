import { z } from "zod";

import { FrozenKnowledgeEntrySchema } from "../../src/features/knowledge/contracts.ts";
import {
  parseSimulatedFixture,
  SimulatedFixtureSchema,
  ToolNameSchema,
} from "../../src/features/tools/contracts.ts";
import { NonEmptyStringSchema } from "../../src/lib/schema.ts";

const FrozenCaseSchema = z
  .object({
    case_id: NonEmptyStringSchema,
    event_id: NonEmptyStringSchema,
    case_class: z.enum(["core", "boundary_or_escalation"]),
    input_variant: NonEmptyStringSchema,
    difficulty: z.enum(["简单", "中等", "困难"]),
    review_status: z.literal("frozen"),
    business_review: z
      .object({
        status: z.enum(["approved", "corrected"]),
        reviewed_on: NonEmptyStringSchema,
        reviewer: NonEmptyStringSchema,
        note: NonEmptyStringSchema,
      })
      .strict(),
    primary_intent: NonEmptyStringSchema,
    user_input: NonEmptyStringSchema,
    given_facts: z.array(NonEmptyStringSchema),
    fixture_refs: z.array(NonEmptyStringSchema.startsWith("FX-")),
    knowledge_refs: z.array(NonEmptyStringSchema.startsWith("KB-")),
    expected: z
      .object({
        first_action: NonEmptyStringSchema,
        customer_answer_must_include: z.array(NonEmptyStringSchema),
        agent_note_must_include: z
          .object({
            symptom_class: NonEmptyStringSchema,
            facts_collected: z.array(NonEmptyStringSchema),
            facts_missing: z.array(NonEmptyStringSchema),
            next_action: NonEmptyStringSchema,
          })
          .strict(),
        hard_escalation: z
          .object({
            required: z.boolean(),
            target: z.array(NonEmptyStringSchema),
            trigger: NonEmptyStringSchema,
          })
          .strict(),
        citation_required: z.array(NonEmptyStringSchema),
        harmful: z.literal(0),
      })
      .strict(),
    veto_if: z.array(NonEmptyStringSchema.startsWith("V-")),
  })
  .strict();

const FrozenEvalSetSchema = z
  .object({
    schema_version: z.literal("devicecare.eval-set.v0.1"),
    eval_set_version: NonEmptyStringSchema,
    lifecycle_status: z.literal("frozen"),
    evidence_boundary: NonEmptyStringSchema,
    source_files: z.array(NonEmptyStringSchema),
    case_composition: z
      .object({
        total: z.number().int().positive(),
        core: z.number().int().nonnegative(),
        boundary_or_escalation: z.number().int().nonnegative(),
        frozen: z.number().int().positive(),
      })
      .strict(),
    business_review_summary: z
      .object({
        reviewed: z.number().int().nonnegative(),
        approved_without_change: z.number().int().nonnegative(),
        corrected: z.number().int().nonnegative(),
        remaining: z.number().int().nonnegative(),
        reviewed_on: NonEmptyStringSchema,
        reviewer: NonEmptyStringSchema,
        counts_as_second_fact_review: z.literal(false),
      })
      .strict(),
    freeze_record: z
      .object({
        frozen_on: NonEmptyStringSchema,
        review_mode: NonEmptyStringSchema,
        independent_external_review: z.literal(false),
        historical_fact_certification: z.literal(false),
        scope: z.literal("controlled_reconstruction_eval_only"),
        audit_record: NonEmptyStringSchema,
        change_policy: NonEmptyStringSchema,
      })
      .strict(),
    veto_catalog: z.array(
      z
        .object({
          id: NonEmptyStringSchema.startsWith("V-"),
          rule: NonEmptyStringSchema,
        })
        .strict(),
    ),
    knowledge_catalog: z.array(FrozenKnowledgeEntrySchema),
    fixture_catalog: z.array(SimulatedFixtureSchema),
    cases: z.array(FrozenCaseSchema),
  })
  .strict();

export type FrozenEvalSet = z.infer<typeof FrozenEvalSetSchema>;

function assertUnique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} contains duplicate ids`);
  }
}

function assertKnownRefs(
  refs: string[],
  known: Set<string>,
  label: string,
): void {
  const missing = refs.filter((ref) => !known.has(ref));
  if (missing.length > 0) {
    throw new Error(`${label} has unresolved refs: ${missing.join(", ")}`);
  }
}

export function validateFrozenEvalSet(input: unknown): FrozenEvalSet {
  const evalSet = FrozenEvalSetSchema.parse(input);

  for (const fixture of evalSet.fixture_catalog) {
    parseSimulatedFixture(fixture);
  }

  const caseIds = evalSet.cases.map((item) => item.case_id);
  const fixtureIds = evalSet.fixture_catalog.map((item) => item.id);
  const knowledgeIds = evalSet.knowledge_catalog.map((item) => item.id);
  const vetoIds = evalSet.veto_catalog.map((item) => item.id);
  const toolNames = new Set(evalSet.fixture_catalog.map((item) => item.tool));

  assertUnique(caseIds, "cases");
  assertUnique(fixtureIds, "fixtures");
  assertUnique(knowledgeIds, "knowledge");
  assertUnique(vetoIds, "vetoes");

  const composition = evalSet.case_composition;
  const coreCount = evalSet.cases.filter(
    (item) => item.case_class === "core",
  ).length;
  const boundaryCount = evalSet.cases.length - coreCount;

  if (
    evalSet.cases.length !== 25 ||
    evalSet.fixture_catalog.length !== 16 ||
    evalSet.knowledge_catalog.length !== 15 ||
    evalSet.veto_catalog.length !== 9 ||
    ToolNameSchema.options.some((tool) => !toolNames.has(tool)) ||
    composition.total !== evalSet.cases.length ||
    composition.frozen !== evalSet.cases.length ||
    composition.core !== coreCount ||
    composition.boundary_or_escalation !== boundaryCount
  ) {
    throw new Error("case_composition does not match cases");
  }

  const hardEscalationCount = evalSet.cases.filter(
    (item) => item.expected.hard_escalation.required,
  ).length;
  if (hardEscalationCount !== 12) {
    throw new Error("hard escalation count does not match the frozen M0 audit");
  }

  if (
    evalSet.business_review_summary.reviewed !== evalSet.cases.length ||
    evalSet.business_review_summary.remaining !== 0
  ) {
    throw new Error("business review summary is incomplete");
  }

  const knownFixtures = new Set(fixtureIds);
  const knownKnowledge = new Set(knowledgeIds);
  const knownVetoes = new Set(vetoIds);

  for (const item of evalSet.cases) {
    assertKnownRefs(item.fixture_refs, knownFixtures, item.case_id);
    assertKnownRefs(item.knowledge_refs, knownKnowledge, item.case_id);
    assertKnownRefs(item.veto_if, knownVetoes, item.case_id);
    assertKnownRefs(
      item.expected.citation_required,
      new Set([...item.fixture_refs, ...item.knowledge_refs]),
      `${item.case_id} citations`,
    );
  }

  return evalSet;
}
