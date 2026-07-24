import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { courses, sessions } from "../../../../db/schema";
import {
  CoursePayload,
  courseValues,
  validateCoursePayload,
} from "../coursePayload";
import { requireAdmin } from "../../auth/auth";

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { courseId } = await context.params;
    const payload = (await request.json()) as CoursePayload;
    const validationError = validateCoursePayload(payload);
    if (validationError) {
      return Response.json({ code: "INVALID_COURSE", message: validationError }, { status: 400 });
    }

    const [course] = await getDb()
      .update(courses)
      .set(courseValues(payload))
      .where(eq(courses.id, courseId))
      .returning();

    if (!course) {
      return Response.json(
        { code: "COURSE_NOT_FOUND", message: "The course was not found." },
        { status: 404 },
      );
    }

    return Response.json({ course });
  } catch (error) {
    return Response.json(
      {
        code: "COURSE_UPDATE_FAILED",
        message: error instanceof Error ? error.message : "The course could not be updated.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdmin(request); if (denied) return denied;
  try {
    const { courseId } = await context.params;
    const linkedSession = await getDb()
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.courseId, courseId))
      .limit(1);

    if (linkedSession.length > 0) {
      return Response.json(
        {
          code: "COURSE_HAS_SESSIONS",
          message: "This course cannot be removed while sessions are linked to it.",
        },
        { status: 409 },
      );
    }

    const [course] = await getDb()
      .delete(courses)
      .where(eq(courses.id, courseId))
      .returning({ id: courses.id });

    if (!course) {
      return Response.json(
        { code: "COURSE_NOT_FOUND", message: "The course was not found." },
        { status: 404 },
      );
    }

    return Response.json({ deleted: true, courseId });
  } catch (error) {
    return Response.json(
      {
        code: "COURSE_DELETE_FAILED",
        message: error instanceof Error ? error.message : "The course could not be removed.",
      },
      { status: 500 },
    );
  }
}
