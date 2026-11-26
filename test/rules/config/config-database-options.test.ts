import rule from "../../../src/plugin/rules/config/config-database-options.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("config-database-options", rule, {
  valid: [
    { code: "export default defineConfig({ database: 'pg' });", filename: "void.config.ts" },
    {
      code: "export default defineConfig({ database: { dialect: 'mysql', casing: 'snake_case' } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ database: { readReplication: true } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ database: { dialect: 'sqlite', readReplication: true } });",
      filename: "void.config.ts",
    },
    {
      code: "export default defineConfig({ cloudflare: { d1_databases: [{ binding: 'DB', database_name: 'x', migrations_dir: 'db/migrations' }] } });",
      filename: "void.config.ts",
    },
    // Not Void's own database: no migrations directory to find.
    {
      code: "export default defineConfig({ cloudflare: { d1_databases: [{ binding: 'ANALYTICS', database_name: 'analytics' }] } });",
      filename: "void.config.ts",
    },
    // Not a Void config file.
    { code: "export default { database: 'postgres' };", filename: "drizzle.config.ts" },
    {
      // reference/config.md:361, a custom D1 binding in `cloudflare`.
      code: `export default defineConfig({
  cloudflare: {
    name: 'my-app',
    d1_databases: [{ binding: 'ANALYTICS', database_name: 'analytics', database_id: '...' }],
    vars: { PUBLIC_API_BASE: 'https://api.example.com' },
  },
});`,
      filename: "void.config.ts",
    },
    {
      // reference/config.md:151, the database option.
      code: `export default defineConfig({
  database: { dialect: 'pg', casing: 'snake_case' },
});`,
      filename: "void.config.ts",
    },
    {
      // guide/database/d1.md:66, enabling read replication.
      code: `import { defineConfig } from 'void/config';

export default defineConfig({
  database: { readReplication: true },
});`,
      filename: "void.config.ts",
    },
  ],
  invalid: [
    {
      code: "export default defineConfig({ database: 'postgres' });",
      filename: "void.config.ts",
      errors: [{ messageId: "database" }],
    },
    {
      code: "export default defineConfig({ database: { dialect: 'pg', casing: 'kebab' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "casing" }],
    },
    {
      code: "export default defineConfig({ database: { dialect: 'oracle' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "dialect" }],
    },
    {
      code: "export default defineConfig({ database: { dialect: 'pg', readReplication: true } });",
      filename: "void.config.ts",
      errors: [{ messageId: "replicationD1" }],
    },
    {
      code: "export default defineConfig({ database: { readReplication: 'yes' } });",
      filename: "void.config.ts",
      errors: [{ messageId: "replicationType" }],
    },
    {
      code: "export default defineConfig({ cloudflare: { d1_databases: [{ binding: 'DB', database_name: 'x' }] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "migrationsDir" }],
    },
    {
      code: "export default defineConfig({ inference: { bindings: { db: 'MY_DB' } }, cloudflare: { d1_databases: [{ binding: 'MY_DB' }] } });",
      filename: "void.config.ts",
      errors: [{ messageId: "migrationsDir" }],
    },
  ],
});
