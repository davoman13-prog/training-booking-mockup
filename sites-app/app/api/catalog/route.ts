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
} from "../../../db/schema";
import { currentAdmin, currentDelegate } from "../auth/auth";

export async function GET(request: Request) {
  try {
    const db = getDb();
    const [courseRows, locationRows, trainerRows, sessionRows, delegateRows, bookingRows, attendanceRows, invoiceRows, certificateRows] = await Promise.all([
      db.select().from(courses),
      db.select().from(locations),
      db.select().from(trainers),
      db.select().from(sessions),
      db.select().from(delegates),
      db.select().from(bookings),
      db.select().from(attendanceRecords),
      db.select().from(invoices),
      db.select().from(certificates),
    ]);

    const admin = await currentAdmin(request);
    const delegate = admin ? null : await currentDelegate(request);
    const visibleBookings = admin ? bookingRows : delegate ? bookingRows.filter((booking) => booking.delegateId === delegate.id) : [];
    const visibleDelegates = admin ? delegateRows : delegate ? delegateRows.filter((row) => row.id === delegate.id) : [];
    const visibleBookingIds = new Set(visibleBookings.map((booking) => booking.id));

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
        bookingIds: visibleBookings.filter((booking) => booking.delegateId === delegate.id).map((booking) => booking.id),
        certificateIds: visibleBookings.filter((booking) => booking.delegateId === delegate.id && booking.certificateId).map((booking) => booking.certificateId),
        invoiceIds: visibleBookings.filter((booking) => booking.delegateId === delegate.id && booking.invoiceId).map((booking) => booking.invoiceId),
      })),
      bookings: visibleBookings,
      attendanceRecords: attendanceRows.filter((record) => visibleBookingIds.has(record.bookingId)),
      invoices: invoiceRows.filter((invoice) => visibleBookingIds.has(invoice.bookingId)).map((invoice) => ({
        ...invoice,
        amount: invoice.amountPence / 100,
        isGenerated: invoice.status !== "draft",
      })),
      certificates: certificateRows.filter((certificate) => visibleBookingIds.has(certificate.bookingId)).map((certificate) => ({
        ...certificate,
        downloadLink: certificate.fileKey ?? undefined,
      })),
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
