import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { courses, locations, sessions } from "../../../../db/schema";
import { LocationPayload, locationValues, validateLocationPayload } from "../locationPayload";

interface RouteContext { params: Promise<{ locationId: string }> }

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { locationId } = await context.params;
    const payload = (await request.json()) as LocationPayload;
    const validationError = validateLocationPayload(payload);
    if (validationError) return Response.json({ message: validationError }, { status: 400 });
    const [location] = await getDb().update(locations).set(locationValues(payload)).where(eq(locations.id, locationId)).returning();
    if (!location) return Response.json({ message: "The location was not found." }, { status: 404 });
    return Response.json({ location });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "The location could not be updated." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { locationId } = await context.params;
    const linked = await getDb().select({ id: sessions.id }).from(sessions)
      .where(eq(sessions.locationId, locationId)).limit(1);
    const courseLinked = await getDb().select({ id: courses.id }).from(courses)
      .where(eq(courses.locationId, locationId)).limit(1);
    if (linked.length || courseLinked.length) {
      return Response.json({ message: "This location cannot be removed while courses or sessions are linked to it." }, { status: 409 });
    }
    await getDb().delete(locations).where(eq(locations.id, locationId));
    return Response.json({ deleted: true, locationId });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "The location could not be removed." }, { status: 500 });
  }
}
