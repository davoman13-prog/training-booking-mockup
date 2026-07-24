import { sessions } from "../../../db/schema";

export interface SessionPayload {
  courseId?: string;
  locationId?: string;
  trainerId?: string | null;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  status?: "scheduled" | "completed" | "cancelled" | "on_hold";
  capacity?: number;
  attendeeCount?: number;
}

export function validateSessionPayload(payload: SessionPayload) {
  if (!payload.courseId) return "Course is required.";
  if (!payload.locationId) return "Location is required.";
  if (!payload.startDate) return "Start date is required.";
  if (!payload.endDate) return "End date is required.";
  if (payload.endDate < payload.startDate) return "End date cannot be before the start date.";
  if (!payload.startTime) return "Start time is required.";
  if (!payload.endTime) return "End time is required.";
  if (payload.startDate === payload.endDate && payload.endTime <= payload.startTime) {
    return "End time must be after the start time.";
  }
  if (!payload.capacity || payload.capacity < 1) return "Capacity must be at least 1.";
  if ((payload.attendeeCount ?? 0) < 0) return "Booked count cannot be negative.";
  if ((payload.attendeeCount ?? 0) > payload.capacity) {
    return "Booked count cannot be greater than capacity.";
  }
  return null;
}

export function sessionValues(payload: SessionPayload) {
  const attendeeCount = payload.attendeeCount ?? 0;
  return {
    courseId: payload.courseId!,
    locationId: payload.locationId!,
    trainerId: payload.trainerId || null,
    startDate: payload.startDate!,
    endDate: payload.endDate!,
    startTime: payload.startTime!,
    endTime: payload.endTime!,
    status: payload.status ?? "scheduled",
    attendeeCount,
    availableSeats: payload.capacity! - attendeeCount,
    updatedAt: new Date().toISOString(),
  } satisfies Partial<typeof sessions.$inferInsert>;
}
