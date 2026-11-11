import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  date,
} from "drizzle-orm/pg-core";

// ---------- Usuários e sessões ----------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // sempre salvo em minúsculas (normalizado antes de gravar)
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// O id da sessão é o SHA-256 do token do cookie: se o banco vazar,
// os tokens reais não vazam junto.
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

// ---------- Listas ----------
// Um "modelo" e um "dia" têm a mesma estrutura (seções + itens).
// Criar um dia a partir de um modelo = copiar as linhas.

export const listKind = pgEnum("list_kind", ["template", "day"]);

export const lists = pgTable(
  "lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: listKind("kind").notNull(),
    name: text("name").notNull(),
    // só para kind = 'day'
    date: date("date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("lists_user_idx").on(t.userId),
    // um usuário só pode ter um "dia" por data
    uniqueIndex("lists_one_day_per_date")
      .on(t.userId, t.date)
      .where(sql`${t.kind} = 'day'`),
  ],
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [index("sections_list_idx").on(t.listId)],
);

export const items = pgTable(
  "items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    done: boolean("done").notNull().default(false),
    doneAt: timestamp("done_at", { withTimezone: true }),
    position: integer("position").notNull(),
  },
  (t) => [index("items_section_idx").on(t.sectionId)],
);
