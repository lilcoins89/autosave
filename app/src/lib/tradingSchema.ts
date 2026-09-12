import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const tradingWatchlists = pgTable("trading_watchlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  network: text("network").notNull(),
  mint: text("mint").notNull(),
  triggerSource: text("trigger_source").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  maxTradeUsd: numeric("max_trade_usd", { precision: 18, scale: 6 }).notNull().default("5"),
  maxSlippageBps: integer("max_slippage_bps").notNull().default(300),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ walletMint: unique().on(table.walletAddress, table.network, table.mint) }));

export const tradingExecutionAttempts = pgTable("trading_execution_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  network: text("network").notNull(),
  idempotencyKey: text("idempotency_key").notNull(),
  inputMint: text("input_mint").notNull(),
  outputMint: text("output_mint").notNull(),
  amountRaw: numeric("amount_raw", { precision: 30, scale: 0 }).notNull(),
  status: text("status").notNull(),
  proposalHash: text("proposal_hash"),
  serializedTransaction: text("serialized_transaction"),
  signature: text("signature"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tradingAuditEvents = pgTable("trading_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  network: text("network").notNull(),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
