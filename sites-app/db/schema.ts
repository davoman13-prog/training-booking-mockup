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
