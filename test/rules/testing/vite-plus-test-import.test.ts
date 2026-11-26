import { fileURLToPath } from "node:url";
import rule from "../../../src/plugin/rules/testing/vite-plus-test-import.ts";
import { RuleTester } from "../../rule-tester.ts";

const vitePlus = fileURLToPath(new URL("./fixtures/vite-plus-app/a.test.ts", import.meta.url));
const plain = fileURLToPath(new URL("./fixtures/plain-app/a.test.ts", import.meta.url));

new RuleTester().run("vite-plus-test-import", rule, {
  valid: [
    { code: "import { it, expect } from 'vite-plus/test';", filename: vitePlus },
    { code: "import { defineConfig } from 'vite-plus';", filename: vitePlus },
    // A project without Vite+ uses vitest.
    { code: "import { it, expect } from 'vitest';", filename: plain },
    {
      // guide/testing.md line 14: with Vite instead of Vite+, tests import from `vitest`.
      code: "import { describe, it, expect } from 'vitest';",
      filename: plain,
    },
  ],
  invalid: [
    {
      code: "import { it, expect } from 'vitest';",
      filename: vitePlus,
      errors: [{ messageId: "vitest" }],
    },
    {
      code: "import { vi } from 'vitest';",
      filename: vitePlus,
      errors: [{ messageId: "vitest" }],
    },
  ],
});
