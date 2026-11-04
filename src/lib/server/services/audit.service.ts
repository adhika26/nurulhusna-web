import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";

type AuditInput = {
  userId?: number | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
};

export async function logAudit(input: AuditInput): Promise<void> {
  await db.insert(table.auditLog).values({
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    metadata: input.metadata ?? null,
    ipAddress: input.ipAddress ?? null
  });
}
