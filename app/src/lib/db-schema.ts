import { bigint, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const walletObservations = pgTable("wallet_observations", {
  address: text("address").primaryKey(),
  balanceLamports: bigint("balance_lamports", { mode: "number" }).notNull().default(0),
  tokenCount: integer("token_count").notNull().default(0),
  transactionCount: integer("transaction_count").notNull().default(0),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull().defaultNow(),
});
