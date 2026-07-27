import { z } from "zod";

import {
  IsoDateTimeSchema,
  JsonValueSchema,
  NonEmptyStringSchema,
  type JsonValue,
} from "../../lib/schema.ts";

export const ToolNameSchema = z.enum([
  "device_profile_lookup",
  "firmware_bundle_lookup",
  "game_support_lookup",
  "config_override_check",
  "roadmap_lookup",
  "order_warranty_lookup",
  "incident_cluster_lookup",
]);

export type ToolName = z.infer<typeof ToolNameSchema>;

const stringField = NonEmptyStringSchema.optional();
const booleanField = z.boolean().optional();
const numberField = z.number().nonnegative().optional();
const nonEmptyResult = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object(shape)
    .strict()
    .refine((value) => Object.keys(value).length > 0, "tool result is empty");

export const ToolResultSchemas = {
  device_profile_lookup: nonEmptyResult({
    model: stringField,
    connection: stringField,
    controller_firmware_relation: stringField,
    controller_firmware_exact: stringField,
    receiver_pairing: stringField,
    game: stringField,
    patch: stringField,
    space_station_adaptation_service: stringField,
    other_trigger_test: stringField,
    hardware_conclusion: stringField,
  }),
  firmware_bundle_lookup: nonEmptyResult({
    model: stringField,
    last_update_state: stringField,
    controller_firmware: stringField,
    receiver_firmware: stringField,
    safe_to_repeat: stringField,
    space_station: stringField,
    si_firmware: stringField,
    bundle_verified: booleanField,
    recurrence_reported: booleanField,
  }),
  game_support_lookup: nonEmptyResult({
    game: stringField,
    store: stringField,
    license_channel: stringField,
    edition: stringField,
    patch: stringField,
    is_current_latest: stringField,
    exact_match: booleanField,
    support_status: stringField,
    memory_or_mod_requires_latest: booleanField,
    configured_targets: z
      .array(
        z
          .object({
            store: NonEmptyStringSchema,
            edition: NonEmptyStringSchema,
          })
          .strict(),
      )
      .optional(),
    store_configs_separate: booleanField,
    internal_reason: stringField,
    name_only_match_disallowed: booleanField,
    last_verified_patch: stringField,
    restore_eta: stringField,
    reported_scene: stringField,
    right_trigger_expected: stringField,
    left_trigger_expected: stringField,
    hardware_conclusion: stringField,
  }),
  config_override_check: nonEmptyResult({
    file: stringField,
    override_present: booleanField,
    override_active: booleanField,
    effective_profile: stringField,
    safe_test: stringField,
    delete_required: booleanField,
    configuration_type: stringField,
    mode: stringField,
    scene_binding: booleanField,
    official_scene_adaptation: booleanField,
    marketed_capability: stringField,
  }),
  roadmap_lookup: nonEmptyResult({
    game: stringField,
    public_schedule: stringField,
    authorized_eta: booleanField,
    request_intake_available: booleanField,
  }),
  order_warranty_lookup: nonEmptyResult({
    order_match: stringField,
    purchase_age_days: numberField,
    refund_eligibility: stringField,
    replacement_eligibility: stringField,
    return_eligibility: stringField,
    authorized_promise: booleanField,
  }),
  incident_cluster_lookup: nonEmptyResult({
    product: stringField,
    reported_units: numberField,
    failed_units: numberField,
    same_purchase_lot: booleanField,
    sn_records_complete: booleanField,
    cluster_status: stringField,
    recall_status: stringField,
    verified_fleet_failure_rate: stringField,
    all_units_affected: stringField,
    future_failure_guarantee: stringField,
    user_claim: stringField,
    sn_batch_match: stringField,
    historical_incident_match: stringField,
    new_incident_required: booleanField,
  }),
} satisfies Record<ToolName, z.ZodType>;

const FixtureIdSchema = NonEmptyStringSchema.startsWith("FX-");

export const ToolInputSchemas = {
  device_profile_lookup: z
    .object({
      fixtureId: FixtureIdSchema,
      deviceRef: NonEmptyStringSchema.optional(),
      model: NonEmptyStringSchema.optional(),
      game: NonEmptyStringSchema.optional(),
      patch: NonEmptyStringSchema.optional(),
    })
    .strict(),
  firmware_bundle_lookup: z
    .object({
      fixtureId: FixtureIdSchema,
      deviceRef: NonEmptyStringSchema.optional(),
      model: NonEmptyStringSchema.optional(),
    })
    .strict(),
  game_support_lookup: z
    .object({
      fixtureId: FixtureIdSchema,
      game: NonEmptyStringSchema,
      store: NonEmptyStringSchema.optional(),
      edition: NonEmptyStringSchema.optional(),
      patch: NonEmptyStringSchema.optional(),
    })
    .strict(),
  config_override_check: z
    .object({
      fixtureId: FixtureIdSchema,
      deviceRef: NonEmptyStringSchema.optional(),
      game: NonEmptyStringSchema.optional(),
      file: NonEmptyStringSchema.optional(),
    })
    .strict(),
  roadmap_lookup: z
    .object({
      fixtureId: FixtureIdSchema,
      game: NonEmptyStringSchema,
    })
    .strict(),
  order_warranty_lookup: z
    .object({
      fixtureId: FixtureIdSchema,
      orderRef: NonEmptyStringSchema.optional(),
    })
    .strict(),
  incident_cluster_lookup: z
    .object({
      fixtureId: FixtureIdSchema,
      product: NonEmptyStringSchema.optional(),
      serialNumbers: z.array(NonEmptyStringSchema).optional(),
    })
    .strict(),
} satisfies Record<ToolName, z.ZodType>;

export const SimulatedFixtureSchema = z
  .object({
    id: FixtureIdSchema,
    provenance: z.literal("controlled_simulation"),
    tool: ToolNameSchema,
    result: z.record(z.string(), JsonValueSchema),
  })
  .strict();

export interface SimulatedFixture {
  id: string;
  provenance: "controlled_simulation";
  tool: ToolName;
  result: Record<string, JsonValue>;
}

export function parseSimulatedFixture(input: unknown): SimulatedFixture {
  const fixture = SimulatedFixtureSchema.parse(input);
  const result = ToolResultSchemas[fixture.tool].parse(fixture.result);
  return { ...fixture, result } as SimulatedFixture;
}

export const ToolRunSchema = z
  .object({
    callId: NonEmptyStringSchema,
    tool: ToolNameSchema,
    fixtureId: FixtureIdSchema,
    status: z.enum(["success", "not_found", "denied", "timeout", "error"]),
    attempts: z.number().int().min(1).max(2),
    startedAt: IsoDateTimeSchema,
    completedAt: IsoDateTimeSchema,
    result: z.record(z.string(), JsonValueSchema).optional(),
    errorCode: NonEmptyStringSchema.optional(),
  })
  .strict()
  .superRefine((run, context) => {
    if (run.status === "success" && run.result === undefined) {
      context.addIssue({ code: "custom", message: "success requires result" });
    }
    if (run.status !== "success" && run.errorCode === undefined) {
      context.addIssue({ code: "custom", message: "failure requires errorCode" });
    }
    if (run.result !== undefined) {
      const parsed = ToolResultSchemas[run.tool].safeParse(run.result);
      if (!parsed.success) {
        context.addIssue({
          code: "custom",
          message: `result does not match ${run.tool}`,
        });
      }
    }
  });

export type ToolRun = z.infer<typeof ToolRunSchema>;
