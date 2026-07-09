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
  viewCount: integer("view_count").notNull().default(0),
  followCount: integer("follow_count").notNull().default(0),
  missingCountry: text("missing_country"),
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
  passwordHash: text("password_hash"),
  githubId: text("github_id").unique(),
  githubUsername: text("github_username"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  adminUsername: text("admin_username").notNull(),
  action: text("action").notNull(), // 'approve' | 'reject' | 'sync' | 'login' | 'logout'
  targetType: text("target_type"), // 'case' | 'system'
  targetId: text("target_id"),
  detail: text("detail"), // extra context
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const clues = pgTable("clues", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  photoUrls: text("photo_urls").default("[]"),
  submitterName: text("submitter_name"),
  submitterContact: text("submitter_contact"),
  status: text("status").default("pending"), // 'pending' | 'approved' | 'rejected'
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value"),
});

// ─── v2.0 新增 ─────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:               text("id").primaryKey(),
  phone:            text("phone").unique().notNull(),
  countryCode:      text("country_code").notNull().default("+86"),
  username:         text("username").notNull(),
  avatarSeed:       text("avatar_seed").notNull(),
  region:           text("region").default("unknown"),
  contactWechat:    text("contact_wechat"),
  contactQq:        text("contact_qq"),
  contactDouyin:    text("contact_douyin"),
  contactBilibili:  text("contact_bilibili"),
  contactX:         text("contact_x"),
  contactInstagram: text("contact_instagram"),
  contactFacebook:  text("contact_facebook"),
  contactEmail:     text("contact_email"),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  lastActiveAt:     timestamp("last_active_at").notNull().defaultNow(),
});

export const follows = pgTable("follows", {
  id:        text("id").primaryKey(),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  caseId:    text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const caseViews = pgTable("case_views", {
  id:          text("id").primaryKey(),
  caseId:      text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

export const questions = pgTable("questions", {
  id:            text("id").primaryKey(),
  caseId:        text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  userId:        text("user_id").references(() => users.id),
  content:       text("content").notNull(),
  submitterName: text("submitter_name"),
  status:        text("status").default("pending"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

export const userActivities = pgTable("user_activities", {
  id:         text("id").primaryKey(),
  userId:     text("user_id").notNull(),
  username:   text("username").notNull(),
  action:     text("action").notNull(), // login|logout|follow|unfollow|update_contact|submit_clue|submit_case|submit_question
  target:     text("target"),           // case name, contact fields, etc
  targetId:   text("target_id"),
  detail:     text("detail"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});
