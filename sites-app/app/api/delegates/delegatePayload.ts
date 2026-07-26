export interface DelegatePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  organisation?: string;
  managerName?: string;
  managerEmail?: string;
  accountStatus?: "active" | "inactive" | "anonymised";
  canLogin?: boolean;
  canBook?: boolean;
  adminNotes?: string;
  specialRequirements?: string;
  staffType?: "manager" | "office" | "clinical";
}

export function validateDelegatePayload(payload: DelegatePayload) {
  if (!payload.firstName?.trim()) return "First name is required.";
  if (!payload.lastName?.trim()) return "Last name is required.";
  if (!payload.email?.trim() || !payload.email.includes("@")) return "A valid email is required.";
  if (!payload.organisation?.trim()) return "Practice or organisation is required.";
  if (!payload.managerName?.trim()) return "Practice manager name is required.";
  if (!payload.managerEmail?.trim() || !payload.managerEmail.includes("@")) return "A valid practice manager email is required.";
  if (!["active", "inactive", "anonymised"].includes(payload.accountStatus ?? "active")) return "Account status is invalid.";
  if (!["manager", "office", "clinical"].includes(payload.staffType ?? "")) return "Choose whether the delegate is management, office staff or clinical staff.";
  return "";
}

export function delegateValues(payload: DelegatePayload) {
  return {
    firstName: payload.firstName!.trim(),
    lastName: payload.lastName!.trim(),
    email: payload.email!.trim().toLowerCase(),
    phone: payload.phone?.trim() || null,
    organisation: payload.organisation!.trim(),
    managerName: payload.managerName!.trim(),
    managerEmail: payload.managerEmail!.trim().toLowerCase(),
    accountStatus: payload.accountStatus ?? "active",
    canLogin: payload.canLogin ?? true,
    canBook: payload.canBook ?? true,
    adminNotes: payload.adminNotes?.trim() ?? "",
    specialRequirements: payload.specialRequirements?.trim() ?? "",
    staffType: payload.staffType!,
    updatedAt: new Date().toISOString(),
  };
}
