import { z } from "zod";

import {
  IsoDateTimeSchema,
  NonEmptyStringSchema,
} from "../../lib/schema.ts";

export const FrozenKnowledgeEntrySchema = z
  .object({
    id: NonEmptyStringSchema.startsWith("KB-"),
    source: NonEmptyStringSchema,
    locator: NonEmptyStringSchema,
    scope: NonEmptyStringSchema,
  })
  .strict();

export const KnowledgeItemSchema = z
  .object({
    id: NonEmptyStringSchema.startsWith("KB-"),
    revision: z.number().int().positive(),
    title: NonEmptyStringSchema,
    content: NonEmptyStringSchema,
    source: NonEmptyStringSchema,
    locator: NonEmptyStringSchema,
    product: NonEmptyStringSchema.optional(),
    model: NonEmptyStringSchema.optional(),
    region: NonEmptyStringSchema.optional(),
    versionScope: NonEmptyStringSchema.optional(),
    status: z.enum(["draft", "published", "withdrawn", "superseded"]),
    visibility: z.enum(["customer", "customer_service", "internal"]),
    owner: NonEmptyStringSchema,
    validFrom: IsoDateTimeSchema,
    validUntil: IsoDateTimeSchema.nullable(),
    reviewDueAt: IsoDateTimeSchema,
    supersedes: NonEmptyStringSchema.startsWith("KB-").optional(),
  })
  .strict();

export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;

export function isKnowledgeRetrievable(item: KnowledgeItem, at: Date): boolean {
  const instant = at.getTime();
  return (
    item.status === "published" &&
    new Date(item.validFrom).getTime() <= instant &&
    (item.validUntil === null || new Date(item.validUntil).getTime() > instant) &&
    new Date(item.reviewDueAt).getTime() >= instant
  );
}
