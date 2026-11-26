import rule from "../../../src/plugin/rules/placement/no-public-import.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("no-public-import", rule, {
  valid: [
    { code: "const logo = '/logo.svg';", filename: "pages/home.tsx" },
    { code: "import data from './data.json';", filename: "pages/home.tsx" },
    { code: "import { x } from '../public/helpers.ts';", filename: "pages/home.tsx" },
    { code: "import logo from './logo.svg';", filename: "pages/home.tsx" },
    { code: "import css from 'some-lib/public/theme.css';", filename: "pages/home.tsx" },
    // reference/structure.md line 135 (public/): the page has no code sample; files there are referenced by root path
    { code: "export const logo = '/logo.svg';", filename: "pages/layout.tsx" },
  ],
  invalid: [
    {
      code: "import logo from '../public/logo.svg';",
      filename: "pages/home.tsx",
      errors: [{ messageId: "imported" }],
    },
    {
      code: "import img from '/public/hero.png';",
      filename: "pages/home.tsx",
      errors: [{ messageId: "imported" }],
    },
    {
      code: "const m = import('../../public/data.json');",
      filename: "pages/docs/page.tsx",
      errors: [{ messageId: "imported" }],
    },
    {
      code: "const f = require('./public/font.woff2');",
      filename: "vite.config.ts",
      errors: [{ messageId: "imported" }],
    },
  ],
});
