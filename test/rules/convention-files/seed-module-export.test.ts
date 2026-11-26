import rule from "../../../src/plugin/rules/convention-files/seed-module-export.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("seed-module-export", rule, {
  valid: [
    {
      code: "import { defineSeed } from 'void/seed';\nexport default defineSeed(async (db) => {});",
      filename: "db/seed.ts",
    },
    { code: "export async function seed(db) {}", filename: "db/seed.ts" },
    { code: "export const run = async () => {};", filename: "lib/seed.ts" },
    { code: "export const seed = async () => {};", filename: "db/seed.mjs" },
    // guide/database.md line 269 (Programmatic seeding)
    {
      code: `import { defineSeed } from 'void/seed';\n\nexport default defineSeed<typeof import('./schema')>(async ({ db, schema }) => {\n  const rows = Array.from({ length: 100 }, (_, i) => ({\n    text: \`Seed message \${i + 1}\`,\n  }));\n\n  await db.insert(schema.messages).values(rows);\n});`,
      filename: "db/seed.ts",
    },
  ],
  invalid: [
    {
      code: "export const run = async () => {};",
      filename: "db/seed.ts",
      errors: [{ messageId: "missing" }],
    },
    { code: "export {};", filename: "db/seed.ts", errors: [{ messageId: "missing" }] },
    {
      code: "export default { rows: [] };",
      filename: "db/seed.ts",
      errors: [{ messageId: "notFunction" }],
    },
  ],
});
