import { getDb } from "../../../db";
import { locations } from "../../../db/schema";
import { LocationPayload, locationValues, validateLocationPayload } from "./locationPayload";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LocationPayload;
    const validationError = validateLocationPayload(payload);
    if (validationError) return Response.json({ message: validationError }, { status: 400 });
    const [location] = await getDb().insert(locations).values({
      id: `loc-${crypto.randomUUID()}`,
      ...locationValues(payload),
      createdAt: new Date().toISOString(),
    }).returning();
    return Response.json({ location }, { status: 201 });
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "The location could not be created." }, { status: 500 });
  }
}
