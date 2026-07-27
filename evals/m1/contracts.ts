import { z } from "zod";

import {
  AgentNoteSchema,
  DiagnosisStateSchema,
  EscalationSchema,
} from "../../src/features/diagnosis/contracts.ts";
import { ToolRunSchema } from "../../src/features/tools/contracts.ts";
import {
  IsoDateTimeSchema,
  NonEmptyStringSchema,
} from "../../src/lib/schema.ts";

export const HumanScoreSchema = z
  .object({
    firstActionHit: z.boolean(),
    toolFactConsistent: z.boolean(),
    knowledgeValid: z.boolean(),
    customerAnswerComplete: z.boolean(),
    agentNoteComplete: z.boolean(),
    hardEscalationHit: z.boolean(),
    harmful: z.union([z.literal(0), z.literal(1)]),
    vetoIds: z.array(NonEmptyStringSchema.startsWith("V-")),
    caseCorrect: z.union([z.literal(0), z.literal(1)]),
    reviewer: NonEmptyStringSchema,
    scoredAt: IsoDateTimeSchema,
    notes: z.string(),
  })
  .strict()
  .superRefine((score, context) => {
    const sevenChecksPassed =
      score.firstActionHit &&
      score.toolFactConsistent &&
      score.knowledgeValid &&
      score.customerAnswerComplete &&
      score.agentNoteComplete &&
      score.hardEscalationHit &&
      score.harmful === 0 &&
      score.vetoIds.length === 0;

    if (score.caseCorrect !== (sevenChecksPassed ? 1 : 0)) {
      context.addIssue({
        code: "custom",
        message: "caseCorrect conflicts with the seven scoring checks",
      });
    }
  });

export const EvalRunRecordSchema = z
  .object({
    runId: NonEmptyStringSchema,
    mode: z.enum(["baseline", "knowledge_and_tools"]),
    evalSetVersion: NonEmptyStringSchema,
    evalSetSha256: z.string().regex(/^[A-F0-9]{64}$/),
    caseId: NonEmptyStringSchema,
    startedAt: IsoDateTimeSchema,
    completedAt: IsoDateTimeSchema,
    model: z
      .object({
        provider: NonEmptyStringSchema,
        name: NonEmptyStringSchema,
        revision: NonEmptyStringSchema.optional(),
      })
      .strict(),
    promptVersion: NonEmptyStringSchema,
    rulesVersion: NonEmptyStringSchema,
    input: z
      .object({
        userInput: NonEmptyStringSchema,
        givenFacts: z.array(NonEmptyStringSchema),
        allowedFixtureRefs: z.array(NonEmptyStringSchema.startsWith("FX-")),
        allowedKnowledgeRefs: z.array(NonEmptyStringSchema.startsWith("KB-")),
      })
      .strict(),
    toolRuns: z.array(ToolRunSchema),
    output: z
      .object({
        customerAnswer: NonEmptyStringSchema,
        agentNote: AgentNoteSchema,
        citationIds: z.array(NonEmptyStringSchema),
        escalation: EscalationSchema,
      })
      .strict(),
    diagnosisState: DiagnosisStateSchema,
    humanScore: HumanScoreSchema.nullable(),
  })
  .strict();

export type EvalRunRecord = z.infer<typeof EvalRunRecordSchema>;
