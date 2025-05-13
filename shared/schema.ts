import { pgTable, text, serial, integer, boolean, timestamp, json, jsonb, doublePrecision, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User schema updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // User ID from Replit Auth
  email: varchar("email", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = InsertUser;

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
// Pipeline schema for managing different workflows
export const pipelines = pgTable("pipelines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  lanes: json("lanes").default([]), // Array of lane objects with id and name
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPipelineSchema = createInsertSchema(pipelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
  pipelineId: integer("pipeline_id"), // Reference to which pipeline this client belongs to
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
  PRESENT_VALUATION: "present_valuation",
  SIGN_AGREEMENTS: "sign_agreements",
  KICKOFF_MEETINGS: "kickoff_meetings",
  CREATE_MARKETING: "create_marketing",
  LAUNCH_MARKETING: "launch_marketing",
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
  actionType: text("action_type"), // Follow-up email, Schedule Appointment, etc.
  customActionType: text("custom_action_type"), // For user-defined action types
  scheduledFor: timestamp("scheduled_for"), // When this task should be performed
  dueDate: timestamp("due_date"),
  assigneeId: integer("assignee_id"),
  relatedLeadId: integer("related_lead_id"),
  relatedDealId: integer("related_deal_id"),
  relatedCustomerId: integer("related_customer_id"),
  addToCalendar: boolean("add_to_calendar").default(false), // Flag to indicate if task should be added to calendar
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
  password: text("password"), // Encrypted password for SMTP
  displayName: text("display_name"), // Display name for email sending
  smtpHost: text("smtp_host"), // SMTP server host
  smtpPort: text("smtp_port"), // SMTP server port
  useSSL: boolean("use_ssl").default(false), // Whether to use SSL for SMTP
  accessToken: text("access_token"), // For OAuth
  refreshToken: text("refresh_token"), // For OAuth
  expiresAt: timestamp("expires_at"), // For OAuth
  isDefault: boolean("is_default").default(false), // Whether this is the default account
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

// Email Message schema for storing emails
export const emailMessages = pgTable("email_messages", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => emailAccounts.id),
  externalId: text("external_id"), // ID from external email provider (Gmail message ID)
  threadId: text("thread_id"), // Thread ID from Gmail
  from: text("from").notNull(),
  fromName: text("from_name"),
  to: text("to").notNull(),
  toName: text("to_name"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  htmlBody: text("html_body"),
  snippet: text("snippet"), // Short preview of message from Gmail
  read: boolean("read").default(false),
  folder: text("folder").default("inbox").notNull(), // inbox, sent, drafts, etc.
  labelIds: text("label_ids"), // JSON stringified array of Gmail label IDs
  relatedLeadId: integer("related_lead_id"),
  relatedCustomerId: integer("related_customer_id"),
  sentDate: timestamp("sent_date").defaultNow(),
  receivedDate: timestamp("received_date"), // When the message was received
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEmailMessageSchema = createInsertSchema(emailMessages).omit({
  id: true,
  createdAt: true,
});

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;

export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = z.infer<typeof insertEmailMessageSchema>;

// Pipeline type
export type Pipeline = typeof pipelines.$inferSelect;
export type InsertPipeline = z.infer<typeof insertPipelineSchema>;
