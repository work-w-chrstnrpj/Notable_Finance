export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  notion: {
    token: process.env.NOTION_TOKEN,
    databases: {
      accounts: process.env.NOTION_ACCOUNTS_DB_ID,
      incomeCategories: process.env.NOTION_INCOME_CATEGORIES_DB_ID,
      incomes: process.env.NOTION_INCOMES_DB_ID,
      expenseCategories: process.env.NOTION_EXPENSE_CATEGORIES_DB_ID,
      expenses: process.env.NOTION_EXPENSES_DB_ID,
      monthlyMonitoring: process.env.NOTION_MONTHLY_MONITORING_DB_ID,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'fallback-dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  cache: {
    // How long (ms) a cached Notion collection is served from memory before the
    // next read refetches just that collection. Balances freshness against the
    // number of Notion API round-trips. Default 45s.
    liveTtlMs: Number(process.env.LIVE_CACHE_TTL_MS ?? 45000),
  },
  encryptionKey: process.env.ENCRYPTION_KEY,
});
