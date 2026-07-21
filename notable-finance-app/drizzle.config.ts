import { defineConfig } from 'drizzle-kit'

// Generates migration SQL from src/main/db/schema.ts into src/main/db/migrations.
// Applied on app start by drizzle's migrator (see src/main/db/index.ts).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema.ts',
  out: './src/main/db/migrations'
})
