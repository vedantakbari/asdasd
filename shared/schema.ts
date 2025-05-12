import { pgTable, text, serial, integer, boolean, timestamp, json, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  avatar: true,
  role: true,
});

// Lead status enum
export const LeadStatus = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  PROPOSAL: "proposal",
  WON: "won",
  LOST: "lost",
  CLIENT: "client", // New status for leads converted to clients
} as const;

// Lead schema
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  source: text("source"),
  status: text("status").default(LeadStatus.NEW).notNull(),
  value: doublePrecision("value"),
  notes: text("notes"),
  ownerId: integer("owner_id"),
  nextActivity: text("next_activity"),
  nextActivityDate: timestamp("next_activity_date"),
  contactPerson: text("contact_person"),
  labels: json("labels").default([]), // Array of labels for the lead
  isClient: boolean("is_client").default(false), // Flag to mark if converted to client
  kanbanLane: text("kanban_lane"), // Kanban lane for client view
  archived: boolean("archived").default(false), // Flag to mark if lead is archived
  customFields: json("custom_fields"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Client Kanban Lane enum
export const KanbanLane = {
  NEW_CLIENT: "new_client",
  IN_PROGRESS: "in_progress",
  FOLLOW_UP: "follow_up",
  UPSELL: "upsell",
  COMPLETED: "completed",
  RECURRING: "recurring",
  REFERRALS: "referrals",
} as const;

// Deal stage enum - keeping for backward compatibility
export const DealStage = {
  PLANNING: "planning",
  IN_PROGRESS: "in_progress",
  INSTALLATION: "installation",
  REVIEW: "review",
  COMPLETED: "completed",
} as const;

// Deal schema
export const deals = pgTable("deals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  value: doublePrecision("value").notNull(),
  stage: text("stage").default(DealStage.PLANNING).notNull(),
  customerId: integer("customer_id").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Customer schema
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  company: text("company"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Task priority enum
export const TaskPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

// Task status enum
export const TaskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

// Task action types
export const TaskActionType = {
  FOLLOW_UP_EMAIL: "follow_up_email",
  SCHEDULE_APPOINTMENT: "schedule_appointment",
  SEND_QUOTE: "send_quote",
  SEND_INVOICE: "send_invoice",
  CUSTOM: "custom",
} as const;

// Task schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").default(TaskPriority.MEDIUM).notNull(),
  status: text("status").default(TaskStatus.TODO).notNull(),
  dueDate: timestamp("due_date"),
  assigneeId: integer("assignee_id"),
  relatedLeadId: integer("related_lead_id"),
  relatedDealId: integer("related_deal_id"),
  relatedCustomerId: integer("related_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Appointment schema
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  description: text("description"),
  customerId: integer("customer_id"),
  leadId: integer("lead_id"),
  dealId: integer("deal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payment schema
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  amount: doublePrecision("amount").notNull(),
  method: text("method").notNull(),
  status: text("status").notNull(),
  dealId: integer("deal_id"),
  customerId: integer("customer_id").notNull(),
  description: text("description"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

// Activity schema for tracking user actions
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  relatedLeadId: integer("related_lead_id"),
  relatedDealId: integer("related_deal_id"),
  relatedCustomerId: integer("related_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Google Calendar Integration settings
export const googleCalendarSettings = pgTable("google_calendar_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clientId: text("client_id"),
  clientSecret: text("client_secret"),
  redirectUri: text("redirect_uri"),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  tokenExpiry: timestamp("token_expiry"),
  connected: boolean("connected").default(false),
  primaryCalendarId: text("primary_calendar_id"),
  syncEnabled: boolean("sync_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGoogleCalendarSettingsSchema = createInsertSchema(googleCalendarSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type GoogleCalendarSettings = typeof googleCalendarSettings.$inferSelect;
export type InsertGoogleCalendarSettings = z.infer<typeof insertGoogleCalendarSettingsSchema>;

// Email Account Integration
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(), // gmail, outlook, imap, etc.
  email: text("email").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  connected: boolean("connected").default(false),
  lastSynced: timestamp("last_synced"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;
