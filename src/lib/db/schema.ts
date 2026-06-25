import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const cases = pgTable("cases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender"),
  birthDate: text("birth_date"),
  lostDate: text("lost_date").notNull(),
  lostProvince: text("lost_province"),
  lostCity: text("lost_city"),
  lostDistrict: text("lost_district"),
  lostAddress: text("lost_address"),
  height: integer("height"),
  feature: text("feature"),
  photoUrls: text("photo_urls").notNull(), // JSON array
  source: text("source").notNull(), // 'api' | 'user_submit' | 'crawl'
  sourceUrl: text("source_url"),
  sourceId: text("source_id"),
  status: text("status").default("pending"), // 'pending' | 'approved' | 'rejected'
  submitterName: text("submitter_name"),
  submitterContact: text("submitter_contact"),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const admins = pgTable("admins", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});
