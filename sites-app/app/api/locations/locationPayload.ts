import { locations } from "../../../db/schema";

export interface LocationPayload {
  name?: string;
  roomName?: string;
  address?: string;
  city?: string;
  postcode?: string;
  capacity?: number;
  isActive?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string | null;
}

export function validateLocationPayload(payload: LocationPayload) {
  if (!payload.name?.trim()) return "Location name is required.";
  if (!payload.roomName?.trim()) return "Room name is required.";
  if (!payload.address?.trim()) return "Address is required.";
  if (!payload.city?.trim()) return "Town or city is required.";
  if (!payload.postcode?.trim()) return "Postcode is required.";
  if (!payload.capacity || payload.capacity < 1) return "Room capacity must be at least 1.";
  if (!payload.contactName?.trim()) return "Contact name is required.";
  if (!payload.contactEmail?.trim()) return "Contact email is required.";
  if (!payload.contactPhone?.trim()) return "Contact phone is required.";
  return null;
}

export function locationValues(payload: LocationPayload) {
  return {
    name: payload.name!.trim(),
    roomName: payload.roomName!.trim(),
    address: payload.address!.trim(),
    city: payload.city!.trim(),
    postcode: payload.postcode!.trim().toUpperCase(),
    capacity: payload.capacity!,
    isActive: payload.isActive ?? true,
    contactName: payload.contactName!.trim(),
    contactEmail: payload.contactEmail!.trim().toLowerCase(),
    contactPhone: payload.contactPhone!.trim(),
    notes: payload.notes?.trim() || null,
    updatedAt: new Date().toISOString(),
  } satisfies Partial<typeof locations.$inferInsert>;
}
