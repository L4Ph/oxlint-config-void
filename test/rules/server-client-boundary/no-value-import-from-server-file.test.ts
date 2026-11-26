import rule from "../../../src/plugin/rules/server-client-boundary/no-value-import-from-server-file.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-value-import-from-server-file", rule, {
  valid: [
    { code: "import type { Props } from './home.server';", filename: "pages/home.tsx" },
    { code: "import { type Props } from './home.server';", filename: "pages/home.tsx" },
    { code: "import { loader } from './home.server';", filename: "pages/home.server.ts" },
    { code: "import { x } from './format';", filename: "pages/home.tsx" },
    { code: "import { loader } from './home.server';", filename: "routes/api.ts" },
    // guide/type-safety.md:69
    {
      code: "import type { Props } from './index.server';\nexport default function UsersPage({ users }: Props) {}",
      filename: "pages/users/index.tsx",
    },
  ],
  invalid: [
    {
      code: "import { Props } from './home.server';",
      filename: "pages/home.tsx",
      errors: [{ messageId: "value" }],
    },
    {
      code: "import { loader } from './home.server';",
      filename: "pages/home.tsx",
      errors: [{ messageId: "value" }],
    },
    {
      code: "import { loader } from '../home.server.ts';",
      filename: "pages/_components/Card.tsx",
      errors: [{ messageId: "value" }],
    },
  ],
});
