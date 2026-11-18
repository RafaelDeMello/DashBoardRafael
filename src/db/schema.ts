import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
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

// Papel: "user" usa o app; "admin" só vê o painel de acessos (criado por script, nunca pela tela).
export const userRole = pgEnum("user_role", ["user", "admin"]);
// Status: quem cria conta pela tela nasce "pending" e só usa o app depois de "approved".
export const userStatus = pgEnum("user_status", ["pending", "approved", "blocked"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // sempre salvo em minúsculas (normalizado antes de gravar)
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("user"),
  // Padrão "pending": se algum código esquecer de definir, falha FECHADO (sem acesso)
  status: userStatus("status").notNull().default("pending"),
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
    // De qual seção do MODELO esta veio (para mudanças "permanentes" acharem o par)
    sourceId: uuid("source_id").references((): AnyPgColumn => sections.id, {
      onDelete: "set null",
    }),
    // Exclusão reversível: preenchido = removida (permite "Desfazer")
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
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
    // De qual item do MODELO este veio
    sourceId: uuid("source_id").references((): AnyPgColumn => items.id, {
      onDelete: "set null",
    }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("items_section_idx").on(t.sectionId)],
);

// ---------- Notas (repositórios, pastas e arquivos) ----------
// Um repositório é a raiz de uma árvore de pastas e arquivos (como um projeto numa IDE).
// Tudo pertence a um usuário; "apagar" é reversível (deleted_at), como nas listas do dia.

export const noteRepos = pgTable(
  "note_repos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("note_repos_user_idx").on(t.userId),
    // nomes únicos por usuário (sem diferenciar maiúsculas), entre os não apagados
    uniqueIndex("note_repos_unique_name")
      .on(t.userId, sql`lower(${t.name})`)
      .where(sql`${t.deletedAt} is null`),
  ],
);

export const noteKind = pgEnum("note_kind", ["folder", "file"]);

export const noteNodes = pgTable(
  "note_nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // user_id repetido de propósito: toda consulta filtra por ele (defesa contra IDOR)
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    repoId: uuid("repo_id")
      .notNull()
      .references(() => noteRepos.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => noteNodes.id, { onDelete: "cascade" }),
    kind: noteKind("kind").notNull(),
    name: text("name").notNull(),
    // só pastas: chave do ícone escolhido (ex.: "database"); nulo = sugerido pelo nome
    icon: text("icon"),
    // só arquivos: texto do arquivo (JSON do editor de notas, ou código puro)
    content: text("content"),
    // só notas de tópicos: o texto puro (sem a estrutura JSON), mantido ao salvar, para a busca
    searchText: text("search_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("note_nodes_repo_idx").on(t.repoId),
    index("note_nodes_parent_idx").on(t.parentId),
    // sem nomes repetidos na mesma pasta (nem na raiz do repositório)
    uniqueIndex("note_nodes_unique_name")
      .on(t.repoId, sql`coalesce(${t.parentId}, '00000000-0000-0000-0000-000000000000'::uuid)`, sql`lower(${t.name})`)
      .where(sql`${t.deletedAt} is null`),
  ],
);
