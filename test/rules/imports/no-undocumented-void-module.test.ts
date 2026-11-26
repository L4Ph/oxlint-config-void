import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { PUBLIC_MODULES } from "../../../src/plugin/lib/imports.ts";
import rule from "../../../src/plugin/rules/imports/no-undocumented-void-module.ts";
import { RuleTester } from "../../rule-tester.ts";

describe("PUBLIC_MODULES", () => {
  it("equals publicModules of norms/reference.json", () => {
    const json = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../../../norms/reference.json", import.meta.url)),
        "utf8",
      ),
    ) as { publicModules: { module: string }[] };
    expect([...PUBLIC_MODULES]).toEqual(json.publicModules.map((entry) => entry.module).toSorted());
  });
});

new RuleTester().run("no-undocumented-void-module", rule, {
  valid: [
    { code: "import { db } from 'void/db';", filename: "routes/a.ts" },
    { code: "import { defineHandler } from 'void';", filename: "routes/a.ts" },
    { code: "import { connectLiveStream } from 'void/live/client';", filename: "pages/a.tsx" },
    // Not Void: a package whose name only starts like it.
    { code: "import x from 'voidzero/_env';", filename: "src/a.ts" },
    {
      // reference/api.md:53 and guide/database.md:296 (the drizzle-zod re-export).
      code: "import { createInsertSchema } from 'void/drizzle-zod';",
      filename: "db/schema.ts",
    },
  ],
  invalid: [
    {
      code: "import { x } from 'void/_env';",
      filename: "routes/a.ts",
      errors: [{ messageId: "undocumented" }],
    },
    {
      code: "import { y } from 'void/pages-client';",
      filename: "pages/a.tsx",
      errors: [{ messageId: "undocumented" }],
    },
    {
      code: "const m = await import('void/internal');\nexport * from 'void/other';",
      filename: "src/a.ts",
      errors: [{ messageId: "undocumented" }, { messageId: "undocumented" }],
    },
  ],
});
