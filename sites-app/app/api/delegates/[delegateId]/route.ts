import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { bookings, delegateAuthAccounts, delegateAuthSessions, delegates } from "../../../../db/schema";
import { DelegatePayload, delegateValues, validateDelegatePayload } from "../delegatePayload";
import { requireAdmin } from "../../auth/auth";

interface RouteContext { params: Promise<{ delegateId: string }> }

export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { delegateId } = await context.params;
    const payload = await request.json() as DelegatePayload;
    const error = validateDelegatePayload(payload);
    if (error) return Response.json({ code: "INVALID_DELEGATE", message: error }, { status: 400 });
    const [delegate] = await getDb().update(delegates).set(delegateValues(payload)).where(eq(delegates.id, delegateId)).returning();
    if (!delegate) return Response.json({ code: "DELEGATE_NOT_FOUND", message: "The delegate was not found." }, { status: 404 });
    return Response.json({ delegate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The delegate could not be updated.";
    return Response.json({ code: message.includes("UNIQUE") ? "EMAIL_IN_USE" : "DELEGATE_UPDATE_FAILED", message: message.includes("UNIQUE") ? "That email address is already registered." : message }, { status: message.includes("UNIQUE") ? 409 : 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { delegateId } = await context.params;
    const [linkedBooking] = await getDb().select({ id: bookings.id }).from(bookings)
      .where(eq(bookings.delegateId, delegateId)).limit(1);
    if (linkedBooking) return Response.json({ code: "DELEGATE_HAS_BOOKINGS", message: "Remove this delegate's booking records before removing their profile." }, { status: 409 });
    const db = getDb();
    await db.delete(delegateAuthSessions).where(eq(delegateAuthSessions.delegateId, delegateId));
    await db.delete(delegateAuthAccounts).where(eq(delegateAuthAccounts.delegateId, delegateId));
    const [delegate] = await db.delete(delegates).where(eq(delegates.id, delegateId)).returning();
    if (!delegate) return Response.json({ code: "DELEGATE_NOT_FOUND", message: "The delegate was not found." }, { status: 404 });
    return Response.json({ deleted: true, delegateId });
  } catch (error) {
    return Response.json({ code: "DELEGATE_DELETE_FAILED", message: error instanceof Error ? error.message : "The delegate could not be removed." }, { status: 500 });
  }
}
