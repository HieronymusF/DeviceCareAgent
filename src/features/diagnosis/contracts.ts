import { z } from "zod";

import {
  IsoDateTimeSchema,
  JsonValueSchema,
  NonEmptyStringSchema,
} from "../../lib/schema.ts";
import { ToolRunSchema } from "../tools/contracts.ts";

export const FactRevisionSchema = z
  .object({
    factId: NonEmptyStringSchema,
    key: NonEmptyStringSchema,
    value: JsonValueSchema,
    source: z
      .object({
        kind: z.enum(["user", "tool", "knowledge", "human"]),
        ref: NonEmptyStringSchema,
      })
      .strict(),
    status: z.enum(["active", "superseded", "disputed"]),
    revision: z.number().int().positive(),
    recordedAt: IsoDateTimeSchema,
    supersedesFactId: NonEmptyStringSchema.optional(),
  })
  .strict();

export const AgentNoteSchema = z
  .object({
    symptomClass: NonEmptyStringSchema,
    factsCollected: z.array(NonEmptyStringSchema),
    factsMissing: z.array(NonEmptyStringSchema),
    nextAction: NonEmptyStringSchema,
    candidateCauses: z.array(NonEmptyStringSchema),
  })
  .strict();

export const EscalationSchema = z
  .object({
    required: z.boolean(),
    target: NonEmptyStringSchema.nullable(),
    reasonCode: NonEmptyStringSchema.nullable(),
    trigger: NonEmptyStringSchema.nullable(),
  })
  .strict()
  .superRefine((escalation, context) => {
    if (
      escalation.required &&
      (escalation.target === null || escalation.reasonCode === null)
    ) {
      context.addIssue({
        code: "custom",
        message: "required escalation needs target and reasonCode",
      });
    }
  });

export const CitationSchema = z
  .object({
    id: NonEmptyStringSchema,
    sourceType: z.enum(["knowledge", "tool"]),
    sourceId: NonEmptyStringSchema,
    validation: z.enum(["valid", "invalid", "expired", "out_of_scope"]),
  })
  .strict();

export const DiagnosisStateSchema = z
  .object({
    conversationId: NonEmptyStringSchema,
    stateVersion: z.number().int().nonnegative(),
    facts: z.array(FactRevisionSchema),
    missingFacts: z.array(NonEmptyStringSchema),
    candidateCauses: z.array(
      z
        .object({
          id: NonEmptyStringSchema,
          label: NonEmptyStringSchema,
          status: z.enum(["candidate", "supported", "rejected", "invalidated"]),
          evidenceRefs: z.array(NonEmptyStringSchema),
          dependsOnFactIds: z.array(NonEmptyStringSchema),
        })
        .strict(),
    ),
    citations: z.array(CitationSchema),
    toolRuns: z.array(ToolRunSchema),
    executedSteps: z.array(NonEmptyStringSchema),
    interactionCount: z.number().int().nonnegative(),
    customerAnswer: z.string().optional(),
    agentNote: AgentNoteSchema.optional(),
    escalation: EscalationSchema,
  })
  .strict();

export type DiagnosisState = z.infer<typeof DiagnosisStateSchema>;
