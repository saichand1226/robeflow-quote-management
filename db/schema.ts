// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), email: text("email").notNull(),
  phone: text("phone").notNull().default(""), address: text("address").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  siteAddress: text("site_address").notNull().default(""),
  notes: text("notes").notNull().default(""),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const teamMembers = sqliteTable("team_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("Salesperson"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
export const staffAccounts = sqliteTable("staff_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Staff"),
  status: text("status").notNull().default("Pending"),
  requestedAt: text("requested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: text("reviewed_at"),
});
export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteNumber: text("quote_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(), project: text("project").notNull(),
  companyName: text("company_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  customerAddress: text("customer_address").notNull().default(""),
  siteAddress: text("site_address").notNull().default(""),
  serviceType: text("service_type").notNull().default("Pick Up"),
  servicePrice: real("service_price").notNull().default(0),
  salespersonName: text("salesperson_name").notNull().default("Sai Muddasani"),
  amount: real("amount").notNull(), status: text("status").notNull().default("Draft"),
  invoiceNumber: text("invoice_number").notNull().default(""),
  invoiceStatus: text("invoice_status").notNull().default("To invoice"),
  paymentNote: text("payment_note").notNull().default(""),
  invoiceSentAt: text("invoice_sent_at"),
  emailedAt: text("emailed_at"), emailId: text("email_id"),
  validUntil: text("valid_until").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  revision: integer("revision").notNull().default(1),
  parentQuoteId: integer("parent_quote_id"),
  followUpDate: text("follow_up_date").notNull().default(""),
  purchaseOrderNumber: text("purchase_order_number").notNull().default(""),
  acceptanceToken: text("acceptance_token").notNull().default(""),
  acceptedAt: text("accepted_at"),
  customerComment: text("customer_comment").notNull().default(""),
  jobStage: text("job_stage").notNull().default("Awaiting acceptance"),
  accountsApproved: integer("accounts_approved", { mode: "boolean" }).notNull().default(false),
  dispatchStatus: text("dispatch_status").notNull().default("Awaiting dispatch"),
  trackingNumber: text("tracking_number").notNull().default(""),
  trackingSentAt: text("tracking_sent_at"),
  pickListStatus: text("pick_list_status").notNull().default("Not generated"),
  pickedBy: text("picked_by").notNull().default(""),
  pickedAt: text("picked_at"),
  discountPercent: real("discount_percent").notNull().default(0),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
});

export const pickListItems = sqliteTable("pick_list_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  areaName: text("area_name").notNull().default(""),
  productName: text("product_name").notNull(),
  sku: text("sku").notNull().default(""),
  quantity: real("quantity").notNull().default(0),
  unitCost: real("unit_cost").notNull().default(0),
  checked: integer("checked", { mode: "boolean" }).notNull().default(false),
  notes: text("notes").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const quoteItems = sqliteTable("quote_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  category: text("category").notNull(),
  systemType: text("system_type").notNull().default("I-Robe"),
  colour: text("colour").notNull().default("White Linear"),
  designSelection: text("design_selection").notNull().default("Custom design"),
  hardwareColour: text("hardware_colour").notNull().default("Undecided"),
  doorConfiguration: text("door_configuration").notNull().default(""),
  mirrorOption: text("mirror_option").notNull().default(""),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const quoteAttachments = sqliteTable("quote_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  objectKey: text("object_key").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const enquiries = sqliteTable("enquiries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  companyName: text("company_name").notNull().default(""),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  siteAddress: text("site_address").notNull().default(""),
  projectType: text("project_type").notNull().default("Wardrobes"),
  areas: text("areas").notNull().default(""),
  preferredColour: text("preferred_colour").notNull().default(""),
  timeframe: text("timeframe").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("New"),
  salespersonName: text("salesperson_name").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const enquiryAttachments = sqliteTable("enquiry_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  enquiryId: integer("enquiry_id").notNull().references(() => enquiries.id),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  objectKey: text("object_key").notNull().unique(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const productCatalog = sqliteTable("product_catalog", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull().default(0),
  effectiveFrom: text("effective_from").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const quoteActivities = sqliteTable("quote_activities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  action: text("action").notNull(),
  detail: text("detail").notNull().default(""),
  actor: text("actor").notNull().default("QuoteFlow"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const jobScheduleEvents = sqliteTable("job_schedule_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  eventType: text("event_type").notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  assignedTo: text("assigned_to").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("Scheduled"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const paymentTransactions = sqliteTable("payment_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quote_id").notNull().references(() => quotes.id),
  amount: real("amount").notNull(),
  paymentDate: text("payment_date").notNull(),
  method: text("method").notNull().default("Bank transfer"),
  reference: text("reference").notNull().default(""),
  notes: text("notes").notNull().default(""),
  recordedBy: text("recorded_by").notNull().default("RobeFlow"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const companySettings = sqliteTable("company_settings", {
  id: integer("id").primaryKey(),
  companyName: text("company_name").notNull().default("QuoteFlow Wardrobes"),
  subtitle: text("subtitle").notNull().default("Custom wardrobe solutions"),
  gstNumber: text("gst_number").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default("Christchurch, New Zealand"),
  bankDetails: text("bank_details").notNull().default(""),
  defaultValidityDays: integer("default_validity_days").notNull().default(30),
  depositPercent: real("deposit_percent").notNull().default(40),
  terms: text("terms").notNull().default("Prices are in New Zealand dollars and include GST. This quotation remains valid until the date shown above."),
  warranty: text("warranty").notNull().default(""),
  installationExclusions: text("installation_exclusions").notNull().default(""),
  emailSignature: text("email_signature").notNull().default("Kind regards\nQuoteFlow Wardrobes"),
});
