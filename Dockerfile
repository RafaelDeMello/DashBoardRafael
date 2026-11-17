# syntax=docker/dockerfile:1
# Imagem de produção do Only-Tasks, em etapas:
#   deps    -> instala as dependências (cache)
#   build   -> compila o app (next build, modo standalone)
#   migrate -> ferramentas de manutenção: aplicar migrações e criar usuário
#   runner  -> o app em si: só o servidor mínimo, rodando sem root

FROM node:22-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------- dependências ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- compilação ----------
FROM deps AS build
COPY . .
# O build NÃO acessa o banco, mas o módulo src/db exige a variável ao ser carregado.
# Este valor é só um marcador (nunca é usado para conectar).
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
RUN npm run build

# ---------- dependências só de produção (para a imagem de manutenção ficar pequena) ----------
FROM base AS proddeps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---------- manutenção (migrações e criação de usuário) ----------
FROM proddeps AS migrate
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY src/db ./src/db
COPY src/lib/password.ts ./src/lib/password.ts
CMD ["node", "scripts/migrate.ts"]

# ---------- aplicação ----------
FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN groupadd --system app && useradd --system --gid app --no-create-home app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
