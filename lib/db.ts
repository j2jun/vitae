import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

// Reuse the connection across hot reloads / lambda invocations instead of
// opening a new pool on every import.
export const sql = globalThis.__sql ?? postgres(process.env.DATABASE_URL!);

if (process.env.NODE_ENV !== "production") {
  globalThis.__sql = sql;
}
