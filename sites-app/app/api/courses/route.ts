import { getDb } from "../../../db";
import { courses } from "../../../db/schema";
import { CoursePayload, courseValues, validateCoursePayload } from "./coursePayload";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CoursePayload;
    const validationError = validateCoursePayload(payload);
    if (validationError) {
      return Response.json({ code: "INVALID_COURSE", message: validationError }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = `course-${crypto.randomUUID()}`;
    const [course] = await getDb()
      .insert(courses)
      .values({
        id,
        ...courseValues(payload),
        isFeatured: false,
        attendeeCount: 0,
        outcomes: "[]",
        createdAt: now,
      })
      .returning();

    return Response.json({ course }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        code: "COURSE_CREATE_FAILED",
        message: error instanceof Error ? error.message : "The course could not be created.",
      },
      { status: 500 },
    );
  }
}
