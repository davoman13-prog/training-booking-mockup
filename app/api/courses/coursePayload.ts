import { courses } from "../../../db/schema";

export interface CoursePayload {
  title?: string;
  category?: string;
  description?: string;
  fundingType?: "funded" | "unfunded";
  status?: "open" | "awaiting_minimum" | "at_risk" | "cancelled" | "completed";
  price?: number | null;
  minimumAttendees?: number | null;
  locationId?: string;
  duration?: string;
  tags?: string[];
  capacity?: number;
}

export function validateCoursePayload(payload: CoursePayload) {
  if (!payload.title?.trim()) return "Course name is required.";
  if (!payload.category?.trim()) return "Category is required.";
  if (!payload.description?.trim()) return "Description is required.";
  if (!payload.locationId) return "Primary location is required.";
  if (!payload.duration?.trim()) return "Duration is required.";
  if (!payload.capacity || payload.capacity < 1) return "Maximum attendees must be at least 1.";
  if (payload.fundingType === "unfunded" && (!payload.price || payload.price <= 0)) {
    return "A positive price is required for an unfunded course.";
  }
  return null;
}

export function courseValues(payload: CoursePayload) {
  return {
    title: payload.title!.trim(),
    category: payload.category!.trim(),
    description: payload.description!.trim(),
    fundingType: payload.fundingType ?? "funded",
    status: payload.status ?? "open",
    pricePence:
      payload.fundingType === "funded" || payload.price == null
        ? null
        : Math.round(payload.price * 100),
    minimumAttendees: payload.minimumAttendees ?? null,
    locationId: payload.locationId!,
    duration: payload.duration!.trim(),
    tags: JSON.stringify(payload.tags ?? []),
    capacity: payload.capacity!,
    updatedAt: new Date().toISOString(),
  } satisfies Partial<typeof courses.$inferInsert>;
}
