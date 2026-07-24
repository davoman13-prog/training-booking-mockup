import { getDb } from "../../../db";
import {
  courses,
  bookings,
  delegates,
  locations,
  sessions,
  trainers,
} from "../../../db/schema";
import {
  courses as seedCourses,
  locations as seedLocations,
  sessions as seedSessions,
  trainers as seedTrainers,
  bookings as seedBookings,
  delegates as seedDelegates,
} from "../../../legacy-src/data/mockData";
import { delegateProfiles } from "../../../legacy-src/pages/admin/delegateUtils";

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
  const catalogEmpty = existing.length === 0;

  if (catalogEmpty) {
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

  const now = new Date().toISOString();
  const delegateValues = seedDelegates.map((delegate) => {
    const [firstName, ...lastName] = delegate.name.split(" ");
    const profile = delegateProfiles[delegate.id];
    return {
      id: delegate.id,
      firstName,
      lastName: lastName.join(" "),
      email: delegate.email,
      phone: profile?.phone ?? null,
      organisation: delegate.organisation,
      managerName: delegate.managerName,
      managerEmail: delegate.managerEmail,
      accountStatus: profile?.accountStatus ?? "active" as const,
      adminNotes: profile?.adminNotes ?? "",
      specialRequirements: delegate.specialRequirements ?? "",
      createdAt: profile?.registrationDate ?? now,
      updatedAt: now,
    };
  });
  for (const batch of chunks(delegateValues, 5)) {
    await db.insert(delegates).values(batch).onConflictDoNothing();
  }

  const bookingValues = seedBookings.map((booking) => ({
    ...booking,
    specialRequirements: booking.specialRequirements ?? null,
    invoiceId: booking.invoiceId ?? null,
    certificateId: booking.certificateId ?? null,
    createdAt: booking.bookingDate,
    updatedAt: now,
  }));
  for (const batch of chunks(bookingValues, 5)) {
    await db.insert(bookings).values(batch).onConflictDoNothing();
  }
}

export async function GET() {
  try {
    await seedCatalogIfEmpty();
    const db = getDb();
    const [courseRows, locationRows, trainerRows, sessionRows, delegateRows, bookingRows] = await Promise.all([
      db.select().from(courses),
      db.select().from(locations),
      db.select().from(trainers),
      db.select().from(sessions),
      db.select().from(delegates),
      db.select().from(bookings),
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
      delegates: delegateRows.map((delegate) => ({
        ...delegate,
        name: `${delegate.firstName} ${delegate.lastName}`.trim(),
        registrationDate: delegate.createdAt,
        bookingIds: bookingRows.filter((booking) => booking.delegateId === delegate.id).map((booking) => booking.id),
        certificateIds: bookingRows.filter((booking) => booking.delegateId === delegate.id && booking.certificateId).map((booking) => booking.certificateId),
        invoiceIds: bookingRows.filter((booking) => booking.delegateId === delegate.id && booking.invoiceId).map((booking) => booking.invoiceId),
      })),
      bookings: bookingRows,
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
