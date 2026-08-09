import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const panelUsers = sqliteTable("panel_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const panelSessions = sqliteTable("panel_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userSettings = sqliteTable("user_settings", {
  userEmail: text("user_email").primaryKey(),
  anthropicKeyCiphertext: text("anthropic_key_ciphertext"),
  anthropicKeyIv: text("anthropic_key_iv"),
  anthropicKeyLastFour: text("anthropic_key_last_four"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
