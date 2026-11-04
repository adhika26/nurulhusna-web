import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                   Enums                                    */
/* -------------------------------------------------------------------------- */

export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);
export const educationLevelEnum = pgEnum("education_level", ["mi", "mts", "none"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const registrationSourceEnum = pgEnum("registration_source", ["online", "offline"]);
export const registrationStatusEnum = pgEnum("registration_status", [
  "draft",
  "submitted",
  "verified",
  "accepted",
  "rejected",
  "checked_in"
]);
export const guardianTypeEnum = pgEnum("guardian_type", ["father", "mother", "guardian"]);
export const guardianStatusEnum = pgEnum("guardian_status", ["alive", "deceased", "unknown"]);
export const addressTypeEnum = pgEnum("address_type", ["father", "mother", "guardian", "student"]);
export const feeScopeEnum = pgEnum("fee_scope", ["pondok", "sekolah"]);
export const paymentSchemeEnum = pgEnum("payment_scheme", ["full", "installment_3"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "unpaid",
  "partial",
  "paid",
  "cancelled"
]);
export const installmentStatusEnum = pgEnum("installment_status", ["unpaid", "paid"]);
export const paymentMethodEnum = pgEnum("payment_method", ["transfer", "cash"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "verified", "rejected"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
};

/* -------------------------------------------------------------------------- */
/*                              Auth & pengguna                               */
/* -------------------------------------------------------------------------- */

export const user = pgTable(
  "user",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 64 }).notNull(),
    email: varchar("email", { length: 255 }),
    passwordHash: text("password_hash").notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    role: userRoleEnum("role").notNull().default("staff"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps
  },
  (table) => [
    uniqueIndex("user_username_idx").on(table.username),
    uniqueIndex("user_email_idx").on(table.email)
  ]
);

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

/* -------------------------------------------------------------------------- */
/*                                Data master                                 */
/* -------------------------------------------------------------------------- */

export const santriCategory = pgTable(
  "santri_category",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 16 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    institutionName: varchar("institution_name", { length: 160 }).notNull(),
    educationLevel: educationLevelEnum("education_level").notNull().default("none"),
    gradeRange: varchar("grade_range", { length: 20 }),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps
  },
  (table) => [uniqueIndex("santri_category_code_idx").on(table.code)]
);

export const registrationWave = pgTable(
  "registration_wave",
  {
    id: serial("id").primaryKey(),
    academicYear: varchar("academic_year", { length: 9 }).notNull(),
    code: varchar("code", { length: 8 }),
    name: varchar("name", { length: 80 }).notNull(),
    opensAt: timestamp("opens_at", { withTimezone: true }),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(false),
    ...timestamps
  },
  (table) => [
    uniqueIndex("registration_wave_year_code_idx").on(table.academicYear, table.code)
  ]
);

/** Penomoran kode pendaftaran per (gelombang, kategori) | atomic. */
export const registrationCounter = pgTable(
  "registration_counter",
  {
    waveId: integer("wave_id")
      .notNull()
      .references(() => registrationWave.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => santriCategory.id, { onDelete: "cascade" }),
    lastNumber: integer("last_number").notNull().default(0)
  },
  (table) => [primaryKey({ columns: [table.waveId, table.categoryId] })]
);

export const province = pgTable("province", {
  id: varchar("id", { length: 2 }).primaryKey(),
  name: varchar("name", { length: 120 }).notNull()
});

export const regency = pgTable(
  "regency",
  {
    id: varchar("id", { length: 5 }).primaryKey(),
    provinceId: varchar("province_id", { length: 2 })
      .notNull()
      .references(() => province.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull()
  },
  (table) => [index("regency_province_idx").on(table.provinceId)]
);

export const district = pgTable(
  "district",
  {
    id: varchar("id", { length: 8 }).primaryKey(),
    regencyId: varchar("regency_id", { length: 5 })
      .notNull()
      .references(() => regency.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull()
  },
  (table) => [index("district_regency_idx").on(table.regencyId)]
);

export const village = pgTable(
  "village",
  {
    id: varchar("id", { length: 13 }).primaryKey(),
    districtId: varchar("district_id", { length: 8 })
      .notNull()
      .references(() => district.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull()
  },
  (table) => [index("village_district_idx").on(table.districtId)]
);

export const feePlan = pgTable(
  "fee_plan",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    waveId: integer("wave_id")
      .notNull()
      .references(() => registrationWave.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => santriCategory.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps
  },
  (table) => [
    uniqueIndex("fee_plan_wave_category_idx").on(table.waveId, table.categoryId)
  ]
);

export const feePlanItem = pgTable(
  "fee_plan_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    feePlanId: uuid("fee_plan_id")
      .notNull()
      .references(() => feePlan.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 160 }).notNull(),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
    scope: feeScopeEnum("scope").notNull().default("pondok"),
    isMandatory: boolean("is_mandatory").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("fee_plan_item_plan_idx").on(table.feePlanId)]
);

/* -------------------------------------------------------------------------- */
/*                                Pendaftaran                                 */
/* -------------------------------------------------------------------------- */

export const registration = pgTable(
  "registration",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    waveId: integer("wave_id")
      .notNull()
      .references(() => registrationWave.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => santriCategory.id),
    source: registrationSourceEnum("source").notNull().default("online"),
    status: registrationStatusEnum("status").notNull().default("submitted"),
    registrationDate: timestamp("registration_date", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Identitas santri
    fullName: varchar("full_name", { length: 160 }).notNull(),
    gender: genderEnum("gender").notNull(),
    birthPlace: varchar("birth_place", { length: 120 }).notNull(),
    birthDate: date("birth_date").notNull(),
    religion: varchar("religion", { length: 32 }).notNull(),
    nationality: varchar("nationality", { length: 32 }).notNull().default("WNI"),
    nik: varchar("nik", { length: 16 }).notNull(),
    kkNumber: varchar("kk_number", { length: 16 }).notNull(),
    nisn: varchar("nisn", { length: 16 }),
    localNis: varchar("local_nis", { length: 32 }),
    siblingCount: integer("sibling_count"),
    birthOrder: integer("birth_order"),

    // Kontak & minat
    aspiration: varchar("aspiration", { length: 160 }),
    hobby: varchar("hobby", { length: 160 }),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 255 }),

    // Sekolah asal
    schoolName: varchar("school_name", { length: 200 }),
    schoolNpsn: varchar("school_npsn", { length: 16 }),
    kipNumber: varchar("kip_number", { length: 32 }),

    photoPath: text("photo_path"),
    notes: text("notes"),

    createdBy: integer("created_by").references(() => user.id),
    verifiedBy: integer("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedInBy: integer("checked_in_by").references(() => user.id),

    ...timestamps
  },
  (table) => [
    uniqueIndex("registration_code_idx").on(table.code),
    index("registration_full_name_idx").on(table.fullName),
    index("registration_phone_idx").on(table.phone),
    index("registration_nik_idx").on(table.nik),
    index("registration_status_idx").on(table.status),
    index("registration_wave_category_idx").on(table.waveId, table.categoryId)
  ]
);

export const guardian = pgTable(
  "guardian",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registration.id, { onDelete: "cascade" }),
    type: guardianTypeEnum("type").notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    status: guardianStatusEnum("status").notNull().default("alive"),
    nationality: varchar("nationality", { length: 32 }).notNull().default("WNI"),
    nik: varchar("nik", { length: 16 }),
    birthPlace: varchar("birth_place", { length: 120 }),
    birthDate: date("birth_date"),
    lastEducation: varchar("last_education", { length: 64 }),
    occupation: varchar("occupation", { length: 120 }),
    monthlyIncome: numeric("monthly_income", { precision: 12, scale: 2, mode: "number" }),
    phone: varchar("phone", { length: 32 }),
    kksNumber: varchar("kks_number", { length: 32 }),
    relationship: varchar("relationship", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("guardian_registration_type_idx").on(table.registrationId, table.type)
  ]
);

export const address = pgTable(
  "address",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registration.id, { onDelete: "cascade" }),
    type: addressTypeEnum("type").notNull(),
    ownershipStatus: varchar("ownership_status", { length: 64 }),
    province: varchar("province", { length: 120 }),
    regency: varchar("regency", { length: 120 }),
    district: varchar("district", { length: 120 }),
    village: varchar("village", { length: 120 }),
    provinceCode: varchar("province_code", { length: 2 }),
    regencyCode: varchar("regency_code", { length: 5 }),
    districtCode: varchar("district_code", { length: 8 }),
    villageCode: varchar("village_code", { length: 13 }),
    rt: varchar("rt", { length: 8 }),
    rw: varchar("rw", { length: 8 }),
    street: varchar("street", { length: 255 }),
    postalCode: varchar("postal_code", { length: 5 }),
    distanceKm: numeric("distance_km", { precision: 6, scale: 2, mode: "number" }),
    transportation: varchar("transportation", { length: 64 }),
    travelMinutes: integer("travel_minutes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("address_registration_type_idx").on(table.registrationId, table.type)]
);

export const registrationChecklist = pgTable(
  "registration_checklist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registration.id, { onDelete: "cascade" }),
    itemKey: varchar("item_key", { length: 32 }).notNull(),
    isChecked: boolean("is_checked").notNull().default(false)
  },
  (table) => [
    uniqueIndex("registration_checklist_unique_idx").on(table.registrationId, table.itemKey)
  ]
);

export const registrationDocument = pgTable(
  "registration_document",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registration.id, { onDelete: "cascade" }),
    itemKey: varchar("item_key", { length: 32 }).notNull(),
    filePath: text("file_path").notNull(),
    originalName: varchar("original_name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    uniqueIndex("registration_document_unique_idx").on(table.registrationId, table.itemKey)
  ]
);

/* -------------------------------------------------------------------------- */
/*                                 Keuangan                                   */
/* -------------------------------------------------------------------------- */

export const invoice = pgTable(
  "invoice",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registration.id, { onDelete: "cascade" }),
    totalAmount: numeric("total_amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
    scheme: paymentSchemeEnum("scheme").notNull(),
    status: invoiceStatusEnum("status").notNull().default("unpaid"),
    notes: text("notes"),
    ...timestamps
  },
  (table) => [uniqueIndex("invoice_registration_idx").on(table.registrationId)]
);

export const installment = pgTable(
  "installment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
    dueDate: date("due_date").notNull(),
    status: installmentStatusEnum("status").notNull().default("unpaid"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [uniqueIndex("installment_invoice_sequence_idx").on(table.invoiceId, table.sequence)]
);

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoice.id, { onDelete: "cascade" }),
    installmentId: uuid("installment_id").references(() => installment.id, {
      onDelete: "set null"
    }),
    amount: numeric("amount", { precision: 12, scale: 2, mode: "number" }).notNull(),
    method: paymentMethodEnum("method").notNull().default("transfer"),
    proofPath: text("proof_path"),
    referenceNumber: varchar("reference_number", { length: 120 }),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    verifiedBy: integer("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    recordedBy: integer("recorded_by").references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    index("payment_invoice_idx").on(table.invoiceId),
    index("payment_status_idx").on(table.status)
  ]
);

/* -------------------------------------------------------------------------- */
/*                              Profil & konten                               */
/* -------------------------------------------------------------------------- */

export const post = pgTable(
  "post",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    coverImage: text("cover_image"),
    category: varchar("category", { length: 32 }).notNull().default("berita"),
    status: postStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    authorId: integer("author_id").references(() => user.id),
    ...timestamps
  },
  (table) => [uniqueIndex("post_slug_idx").on(table.slug)]
);

export const page = pgTable(
  "page",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 200 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    content: text("content").notNull(),
    isPublished: boolean("is_published").notNull().default(true),
    ...timestamps
  },
  (table) => [uniqueIndex("page_slug_idx").on(table.slug)]
);

export const galleryItem = pgTable("gallery_item", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 160 }),
  description: text("description"),
  imagePath: text("image_path").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const setting = pgTable("setting", {
  key: varchar("key", { length: 80 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: integer("user_id").references(() => user.id),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }),
    entityId: varchar("entity_id", { length: 64 }),
    metadata: jsonb("metadata"),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("audit_log_created_idx").on(table.createdAt)]
);

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const registrationRelations = relations(registration, ({ one, many }) => ({
  category: one(santriCategory, {
    fields: [registration.categoryId],
    references: [santriCategory.id]
  }),
  wave: one(registrationWave, {
    fields: [registration.waveId],
    references: [registrationWave.id]
  }),
  guardians: many(guardian),
  addresses: many(address),
  checklist: many(registrationChecklist),
  documents: many(registrationDocument),
  invoice: one(invoice, {
    fields: [registration.id],
    references: [invoice.registrationId]
  })
}));

export const guardianRelations = relations(guardian, ({ one }) => ({
  registration: one(registration, {
    fields: [guardian.registrationId],
    references: [registration.id]
  })
}));

export const addressRelations = relations(address, ({ one }) => ({
  registration: one(registration, {
    fields: [address.registrationId],
    references: [registration.id]
  })
}));

export const invoiceRelations = relations(invoice, ({ one, many }) => ({
  registration: one(registration, {
    fields: [invoice.registrationId],
    references: [registration.id]
  }),
  installments: many(installment),
  payments: many(payment)
}));

export const installmentRelations = relations(installment, ({ one }) => ({
  invoice: one(invoice, { fields: [installment.invoiceId], references: [invoice.id] })
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  invoice: one(invoice, { fields: [payment.invoiceId], references: [invoice.id] }),
  installment: one(installment, {
    fields: [payment.installmentId],
    references: [installment.id]
  })
}));

export const feePlanRelations = relations(feePlan, ({ one, many }) => ({
  wave: one(registrationWave, {
    fields: [feePlan.waveId],
    references: [registrationWave.id]
  }),
  category: one(santriCategory, {
    fields: [feePlan.categoryId],
    references: [santriCategory.id]
  }),
  items: many(feePlanItem)
}));

export const feePlanItemRelations = relations(feePlanItem, ({ one }) => ({
  plan: one(feePlan, { fields: [feePlanItem.feePlanId], references: [feePlan.id] })
}));

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type SantriCategory = typeof santriCategory.$inferSelect;
export type Province = typeof province.$inferSelect;
export type Regency = typeof regency.$inferSelect;
export type District = typeof district.$inferSelect;
export type Village = typeof village.$inferSelect;
export type RegistrationWave = typeof registrationWave.$inferSelect;
export type Registration = typeof registration.$inferSelect;
export type NewRegistration = typeof registration.$inferInsert;
export type Guardian = typeof guardian.$inferSelect;
export type Address = typeof address.$inferSelect;
export type RegistrationDocument = typeof registrationDocument.$inferSelect;
export type Invoice = typeof invoice.$inferSelect;
export type Installment = typeof installment.$inferSelect;
export type Payment = typeof payment.$inferSelect;
export type FeePlan = typeof feePlan.$inferSelect;
export type FeePlanItem = typeof feePlanItem.$inferSelect;
export type Post = typeof post.$inferSelect;
export type Page = typeof page.$inferSelect;
export type GalleryItem = typeof galleryItem.$inferSelect;
