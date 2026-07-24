import { trainers } from "../../../db/schema";

export interface TrainerPayload {
  firstName?: string; lastName?: string; email?: string; phone?: string;
  alternativePhone?: string | null; organisation?: string; addressLine1?: string;
  addressLine2?: string | null; townCity?: string; county?: string; postcode?: string;
  notes?: string; status?: "active" | "inactive"; approvedCourseIds?: string[];
}

export function validateTrainerPayload(payload: TrainerPayload) {
  if (!payload.firstName?.trim()) return "First name is required.";
  if (!payload.lastName?.trim()) return "Last name is required.";
  if (!payload.email?.trim()) return "Email is required.";
  if (!payload.phone?.trim()) return "Phone is required.";
  if (!payload.organisation?.trim()) return "Organisation is required.";
  if (!payload.addressLine1?.trim()) return "Address line 1 is required.";
  if (!payload.townCity?.trim()) return "Town or city is required.";
  if (!payload.county?.trim()) return "County is required.";
  if (!payload.postcode?.trim()) return "Postcode is required.";
  return null;
}

export function trainerValues(payload: TrainerPayload) {
  return {
    firstName: payload.firstName!.trim(), lastName: payload.lastName!.trim(),
    email: payload.email!.trim().toLowerCase(), phone: payload.phone!.trim(),
    alternativePhone: payload.alternativePhone?.trim() || null,
    organisation: payload.organisation!.trim(), addressLine1: payload.addressLine1!.trim(),
    addressLine2: payload.addressLine2?.trim() || null, townCity: payload.townCity!.trim(),
    county: payload.county!.trim(), postcode: payload.postcode!.trim().toUpperCase(),
    notes: payload.notes?.trim() ?? "", status: payload.status ?? "active",
    approvedCourseIds: JSON.stringify(payload.approvedCourseIds ?? []),
    updatedAt: new Date().toISOString(),
  } satisfies Partial<typeof trainers.$inferInsert>;
}
