import { getDb } from "../../../db";
import { delegates } from "../../../db/schema";
import { DelegatePayload, delegateValues, validateDelegatePayload } from "./delegatePayload";
import { requireAdmin } from "../auth/auth";

export async function POST(request: Request) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const payload = await request.json() as DelegatePayload;
    const error = validateDelegatePayload(payload);
    if (error) return Response.json({ code: "INVALID_DELEGATE", message: error }, { status: 400 });
    const [delegate] = await getDb().insert(delegates).values({
      id: `delegate-${crypto.randomUUID()}`,
      ...delegateValues(payload),
      createdAt: new Date().toISOString(),
    }).returning();
    return Response.json({ delegate }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The delegate could not be created.";
    return Response.json({ code: message.includes("UNIQUE") ? "EMAIL_IN_USE" : "DELEGATE_CREATE_FAILED", message: message.includes("UNIQUE") ? "That email address is already registered." : message }, { status: message.includes("UNIQUE") ? 409 : 500 });
  }
}
