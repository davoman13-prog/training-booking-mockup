import { getDb } from "../../../db";
import {
  courses,
  locations,
  sessions,
  trainers,
} from "../../../db/schema";
import {
  courses as seedCourses,
  locations as seedLocations,
  sessions as seedSessions,
  trainers as seedTrainers,
} from "../../../legacy-src/data/mockData";

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function seedCatalogIfEmpty() {
  const db = getDb();
  const existing = await db.select({ id: courses.id }).from(courses).limit(1);
  if (existing.length > 0) return;

  const locationValues = seedLocations.map((location) => ({
      ...location,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  }));
  for (const batch of chunks(locationValues, 5)) {
    await db.insert(locations).values(batch).onConflictDoNothing();
  }

  const trainerValues = seedTrainers.map((trainer) => ({
      ...trainer,
      approvedCourseIds: JSON.stringify(trainer.approvedCourseIds),
      createdAt: trainer.createdDate,
      updatedAt: trainer.updatedDate,
  }));
  for (const batch of chunks(trainerValues, 5)) {
    await db.insert(trainers).values(batch).onConflictDoNothing();
  }

  const courseValues = seedCourses.map((course) => ({
      id: course.id,
      title: course.title,
      category: course.category,
      description: course.description,
      fundingType: course.fundingType,
      status: course.status,
      pricePence: course.price == null ? null : Math.round(course.price * 100),
      minimumAttendees: course.minimumAttendees,
      invoiceTriggerDate: course.invoiceTriggerDate,
      cancellationCutoffDate: course.cancellationCutoffDate,
      locationId: course.locationId,
      duration: course.duration,
      tags: JSON.stringify(course.tags),
      isFeatured: course.isFeatured,
      capacity: course.capacity,
      attendeeCount: course.attendeeCount,
      outcomes: JSON.stringify(course.outcomes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  }));
  for (const batch of chunks(courseValues, 5)) {
    await db.insert(courses).values(batch).onConflictDoNothing();
  }

  const sessionValues = seedSessions.map((session) => ({
      ...session,
      trainerId: session.trainerId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
  }));
  for (const batch of chunks(sessionValues, 5)) {
    await db.insert(sessions).values(batch).onConflictDoNothing();
  }
}

export async function GET() {
  try {
    await seedCatalogIfEmpty();
    const db = getDb();
    const [courseRows, locationRows, trainerRows, sessionRows] = await Promise.all([
      db.select().from(courses),
      db.select().from(locations),
      db.select().from(trainers),
      db.select().from(sessions),
    ]);

    return Response.json({
      courses: courseRows.map((course) => ({
        ...course,
        price: course.pricePence == null ? undefined : course.pricePence / 100,
        sessionIds: sessionRows
          .filter((session) => session.courseId === course.id)
          .map((session) => session.id),
        tags: JSON.parse(course.tags) as string[],
        outcomes: JSON.parse(course.outcomes) as string[],
      })),
      locations: locationRows,
      trainers: trainerRows.map((trainer) => ({
        ...trainer,
        approvedCourseIds: JSON.parse(trainer.approvedCourseIds) as string[],
        createdDate: trainer.createdAt,
        updatedDate: trainer.updatedAt,
      })),
      sessions: sessionRows,
    });
  } catch (error) {
    console.error("Catalogue load failed.", error);
    return Response.json(
      {
        code: "CATALOGUE_UNAVAILABLE",
        message: error instanceof Error ? error.message : "The course catalogue is unavailable.",
      },
      { status: 500 },
    );
  }
}
