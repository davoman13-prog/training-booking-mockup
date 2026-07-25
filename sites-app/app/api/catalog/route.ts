import { getDb } from "../../../db";
import {
  courses,
  bookings,
  delegates,
  locations,
  sessions,
  trainers,
  attendanceRecords,
  invoices,
  certificates,
  waitingListEntries,
} from "../../../db/schema";
import { currentAdmin, currentDelegate } from "../auth/auth";
import { eq, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const admin = await currentAdmin(request);
    const delegate = admin ? null : await currentDelegate(request);
    const [courseRows, locationRows, trainerRows, sessionRows] = await Promise.all([
      db.select().from(courses),
      db.select().from(locations),
      db.select().from(trainers),
      db.select().from(sessions),
    ]);
    const [visibleBookings, visibleDelegates, visibleWaitingRows] = await Promise.all([
      admin
        ? db.select().from(bookings)
        : delegate
          ? db.select().from(bookings).where(eq(bookings.delegateId, delegate.id))
          : Promise.resolve([]),
      admin
        ? db.select().from(delegates)
        : delegate
          ? db.select().from(delegates).where(eq(delegates.id, delegate.id))
          : Promise.resolve([]),
      admin
        ? db.select().from(waitingListEntries)
        : delegate
          ? db.select().from(waitingListEntries).where(eq(waitingListEntries.delegateId, delegate.id))
          : Promise.resolve([]),
    ]);
    const visibleBookingIds = new Set(visibleBookings.map((booking) => booking.id));
    const [attendanceRows, invoiceRows, certificateRows] = visibleBookingIds.size
      ? await Promise.all([
          db.select().from(attendanceRecords).where(inArray(attendanceRecords.bookingId, [...visibleBookingIds])),
          db.select().from(invoices).where(inArray(invoices.bookingId, [...visibleBookingIds])),
          db.select().from(certificates).where(inArray(certificates.bookingId, [...visibleBookingIds])),
        ])
      : [[], [], []];
    const bookingsByDelegate = new Map<string, typeof visibleBookings>();
    for (const booking of visibleBookings) {
      const existing = bookingsByDelegate.get(booking.delegateId) ?? [];
      existing.push(booking);
      bookingsByDelegate.set(booking.delegateId, existing);
    }

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
      delegates: visibleDelegates.map((delegate) => ({
        ...delegate,
        name: `${delegate.firstName} ${delegate.lastName}`.trim(),
        registrationDate: delegate.createdAt,
        bookingIds: (bookingsByDelegate.get(delegate.id) ?? []).map((booking) => booking.id),
        certificateIds: (bookingsByDelegate.get(delegate.id) ?? []).filter((booking) => booking.certificateId).map((booking) => booking.certificateId),
        invoiceIds: (bookingsByDelegate.get(delegate.id) ?? []).filter((booking) => booking.invoiceId).map((booking) => booking.invoiceId),
      })),
      bookings: visibleBookings,
      attendanceRecords: attendanceRows,
      invoices: invoiceRows.map((invoice) => ({
        ...invoice,
        amount: invoice.amountPence / 100,
        isGenerated: invoice.status !== "draft",
      })),
      certificates: certificateRows.map((certificate) => ({
        ...certificate,
        downloadLink: certificate.fileKey && ["issued", "available"].includes(certificate.status) ? `/api/certificates/${certificate.id}/download` : undefined,
      })),
      waitingListEntries: visibleWaitingRows,
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
