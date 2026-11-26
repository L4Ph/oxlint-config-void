import rule from "../../../src/plugin/rules/pages/loader-return-serializable.ts";
import { RuleTester } from "../../rule-tester.ts";

const HANDLER = "import { defineHandler } from 'void';\n";

new RuleTester().run("loader-return-serializable", rule, {
  valid: [
    {
      code: HANDLER + "export const loader = defineHandler(() => ({ at: new Date() }));",
      filename: "pages/a.server.ts",
    },
    {
      code: HANDLER + "export const loader = defineHandler(() => ({ ids: new Set([1]) }));",
      filename: "pages/a.server.ts",
    },
    {
      // Not a page companion.
      code:
        HANDLER + "export const loader = defineHandler(() => ({ fmt: (n: number) => String(n) }));",
      filename: "routes/a.ts",
    },
    {
      // A class from another file is unknown to this one, so it is not judged.
      code:
        HANDLER +
        "import { Money } from './_money';\nexport const loader = defineHandler(() => ({ m: new Money() }));",
      filename: "pages/a.server.ts",
    },
    {
      // guide/pages-routing/loaders.md:23-25
      code: `import { defineHandler } from 'void';
import { db } from 'void/db';

export const loader = defineHandler(async (c) => {
  return { users: await db.select().from(users) };
});`,
      filename: "pages/users/index.server.ts",
    },
  ],
  invalid: [
    {
      code:
        HANDLER + "export const loader = defineHandler(() => ({ fmt: (n: number) => String(n) }));",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "function" }],
    },
    {
      code:
        HANDLER +
        "class Money {}\nexport const loader = defineHandler(() => ({ m: new Money() }));",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "instance" }],
    },
  ],
});
