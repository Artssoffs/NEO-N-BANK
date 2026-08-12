import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  balance: doublePrecision('balance').default(0),
  cashBalance: doublePrecision('cash_balance').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid)
    .notNull(),
  type: text('type').notNull(),
  amount: doublePrecision('amount').notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  status: text('status').notNull(),
  receiptNumber: text('receipt_number').notNull(),
  isCash: boolean('is_cash').default(false),
  paymentMethod: text('payment_method'),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const cashEnvelopes = pgTable('cash_envelopes', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid)
    .notNull(),
  name: text('name').notNull(),
  amount: doublePrecision('amount').notNull(),
  targetAmount: doublePrecision('target_amount').notNull(),
  category: text('category').notNull(),
  iconName: text('icon_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  cashEnvelopes: many(cashEnvelopes),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.uid],
  }),
}));

export const cashEnvelopesRelations = relations(cashEnvelopes, ({ one }) => ({
  user: one(users, {
    fields: [cashEnvelopes.userId],
    references: [users.uid],
  }),
}));
