import rule from "../../../src/plugin/rules/forms-actions/preserve-scroll-placement.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("preserve-scroll-placement", rule, {
  valid: [
    {
      code: `import { useForm } from '@void/react';\nconst f = useForm('/x', init, { preserveScroll: true });`,
      filename: "pages/x.tsx",
    },
    {
      code: `import { useForm } from '@void/vue';\nconst f = useForm('/x', init);\nf.post({ preserveScroll: true });`,
      filename: "pages/x.tsx",
    },
    {
      // Not governed: a server companion.
      code: `import { useForm } from '@void/react';\nconst f = useForm('/x', init);\nf.post({ preserveScroll: true });`,
      filename: "pages/x.server.ts",
    },
    {
      // guide/pages-routing/actions-and-forms.md:239 (Scroll after submission): Vue, Svelte, Solid
      code: `import { useForm } from '@void/solid';\nconst form = useForm('/users', { name: '' });\nform.post({ preserveScroll: false });`,
      filename: "pages/users.tsx",
    },
  ],
  invalid: [
    {
      code: `import { useForm } from '@void/react';\nconst f = useForm('/x', init);\nf.post({ preserveScroll: true });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "react" }],
    },
    {
      code: `import { useForm } from '@void/svelte';\nconst f = useForm('/x', init, { preserveScroll: true });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "other" }],
    },
  ],
});
