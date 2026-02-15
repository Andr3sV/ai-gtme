import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);

export const agentRunStatusEnum = pgEnum("agent_run_status", [
  "pending",
  "running",
  "completed",
  "failed",
]);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const agentRuns = pgTable("agent_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  messageId: uuid("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  status: agentRunStatusEnum("status").notNull().default("pending"),
  resultSnapshot: jsonb("result_snapshot"),
  langsmithRunId: text("langsmith_run_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalId: text("external_id"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const businessCollectedData = pgTable("business_collected_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  payload: jsonb("payload").notNull(),
  collectedAt: timestamp("collected_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  agentRunId: uuid("agent_run_id").references(() => agentRuns.id, {
    onDelete: "set null",
  }),
});

export const businessListings = pgTable("business_listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentRunId: uuid("agent_run_id")
    .notNull()
    .references(() => agentRuns.id, { onDelete: "cascade" }),
  businessId: uuid("business_id").references(() => businesses.id, {
    onDelete: "set null",
  }),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations
export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
  agentRuns: many(agentRuns),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations),
  agentRuns: many(agentRuns),
}));

export const agentRunsRelations = relations(agentRuns, ({ one, many }) => ({
  conversation: one(conversations),
  message: one(messages),
  businessListings: many(businessListings),
  businessCollectedData: many(businessCollectedData),
}));

export const businessesRelations = relations(businesses, ({ many }) => ({
  businessCollectedData: many(businessCollectedData),
  businessListings: many(businessListings),
}));

export const businessCollectedDataRelations = relations(
  businessCollectedData,
  ({ one }) => ({
    business: one(businesses),
    agentRun: one(agentRuns),
  })
);

export const businessListingsRelations = relations(
  businessListings,
  ({ one }) => ({
    agentRun: one(agentRuns),
    business: one(businesses),
  })
);
