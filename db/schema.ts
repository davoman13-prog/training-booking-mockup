import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const organisations = sqliteTable("organisations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  billingEmail: text("billing_email"),
  phone: text("phone"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone"),
  role: text("role", { enum: ["Delegate", "Admin"] })
    .notNull()
    .default("Delegate"),
  organisationId: text("organisation_id").references(() => organisations.id),
  managerName: text("manager_name"),
  managerEmail: text("manager_email"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isAnonymised: integer("is_anonymised", { mode: "boolean" })
    .notNull()
    .default(false),
  ...timestamps,
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  details: text("details"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postcode: text("postcode").notNull(),
  roomName: text("room_name").notNull(),
  capacity: integer("capacity").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  notes: text("notes"),
  ...timestamps,
});

export const trainers = sqliteTable("trainers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  alternativePhone: text("alternative_phone"),
  organisation: text("organisation").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  townCity: text("town_city").notNull(),
  county: text("county").notNull(),
  postcode: text("postcode").notNull(),
  notes: text("notes").notNull().default(""),
  status: text("status", { enum: ["active", "inactive"] }).notNull(),
  approvedCourseIds: text("approved_course_ids").notNull().default("[]"),
  ...timestamps,
});

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  fundingType: text("funding_type", { enum: ["funded", "unfunded"] }).notNull(),
  status: text("status", {
    enum: ["open", "awaiting_minimum", "at_risk", "cancelled", "completed"],
  }).notNull(),
  pricePence: integer("price_pence"),
  minimumAttendees: integer("minimum_attendees"),
  invoiceTriggerDate: text("invoice_trigger_date"),
  cancellationCutoffDate: text("cancellation_cutoff_date"),
  locationId: text("location_id").notNull().references(() => locations.id),
  duration: text("duration").notNull(),
  tags: text("tags").notNull().default("[]"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  capacity: integer("capacity").notNull(),
  attendeeCount: integer("attendee_count").notNull().default(0),
  outcomes: text("outcomes").notNull().default("[]"),
  ...timestamps,
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  courseId: text("course_id").notNull().references(() => courses.id),
  locationId: text("location_id").notNull().references(() => locations.id),
  trainerId: text("trainer_id").references(() => trainers.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status", {
    enum: ["scheduled", "completed", "cancelled", "on_hold"],
  }).notNull(),
  availableSeats: integer("available_seats").notNull(),
  attendeeCount: integer("attendee_count").notNull().default(0),
  ...timestamps,
});

export const delegates = sqliteTable("delegates", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  organisation: text("organisation").notNull(),
  managerName: text("manager_name").notNull(),
  managerEmail: text("manager_email").notNull(),
  accountStatus: text("account_status", {
    enum: ["active", "inactive", "anonymised"],
  }).notNull().default("active"),
  adminNotes: text("admin_notes").notNull().default(""),
  specialRequirements: text("special_requirements").notNull().default(""),
  ...timestamps,
});

export const delegateAuthAccounts = sqliteTable("delegate_auth_accounts", {
  delegateId: text("delegate_id").primaryKey().references(() => delegates.id),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  passwordUpdatedAt: text("password_updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  ...timestamps,
});

export const delegateAuthSessions = sqliteTable("delegate_auth_sessions", {
  id: text("id").primaryKey(),
  delegateId: text("delegate_id").notNull().references(() => delegates.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  lastUsedAt: text("last_used_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminAuthAccounts = sqliteTable("admin_auth_accounts", {
  userId: text("user_id").primaryKey().references(() => users.id),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  passwordUpdatedAt: text("password_updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  ...timestamps,
});

export const adminAuthSessions = sqliteTable("admin_auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  lastUsedAt: text("last_used_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  delegateId: text("delegate_id").notNull().references(() => delegates.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  locationId: text("location_id").notNull().references(() => locations.id),
  bookingDate: text("booking_date").notNull(),
  status: text("status", {
    enum: ["confirmed", "pending", "cancelled", "completed"],
  }).notNull(),
  paymentRequired: integer("payment_required", { mode: "boolean" }).notNull(),
  termsAccepted: integer("terms_accepted", { mode: "boolean" }).notNull(),
  specialRequirements: text("special_requirements"),
  attendanceMarked: integer("attendance_marked", { mode: "boolean" }).notNull().default(false),
  invoiceId: text("invoice_id"),
  certificateId: text("certificate_id"),
  ...timestamps,
});

export const attendanceRecords = sqliteTable("attendance_records", {
  bookingId: text("booking_id").primaryKey().references(() => bookings.id),
  outcome: text("outcome", { enum: ["pending", "attended", "absent"] }).notNull().default("pending"),
  notes: text("notes").notNull().default(""),
  markedByUserId: text("marked_by_user_id").references(() => users.id),
  markedAt: text("marked_at"),
  ...timestamps,
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique().references(() => bookings.id),
  delegateId: text("delegate_id").notNull().references(() => delegates.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  amountPence: integer("amount_pence").notNull(),
  issuedDate: text("issued_date"),
  dueDate: text("due_date").notNull(),
  status: text("status", { enum: ["draft", "issued", "paid", "overdue", "cancelled"] }).notNull().default("draft"),
  paidAt: text("paid_at"),
  ...timestamps,
});

export const certificates = sqliteTable("certificates", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().unique().references(() => bookings.id),
  delegateId: text("delegate_id").notNull().references(() => delegates.id),
  courseId: text("course_id").notNull().references(() => courses.id),
  issuedDate: text("issued_date"),
  status: text("status", { enum: ["pending", "available", "issued", "revoked"] }).notNull().default("pending"),
  fileKey: text("file_key"),
  emailedAt: text("emailed_at"),
  ...timestamps,
});
