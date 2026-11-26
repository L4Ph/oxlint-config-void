import rule from "../../../src/plugin/rules/forms-actions/use-form-params-option.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { useForm } from '@void/react';\n`;

new RuleTester().run("use-form-params-option", rule, {
  valid: [
    {
      code: `${head}const f = useForm('/posts/[id]', init, { params: { id } });`,
      filename: "pages/x.tsx",
    },
    { code: `${head}const g = useForm('/posts', init);`, filename: "pages/x.tsx" },
    {
      // Options built elsewhere may carry params.
      code: `${head}const f = useForm('/posts/[id]', init, options);`,
      filename: "pages/x.tsx",
    },
    {
      // Not governed: a server companion.
      code: `${head}const f = useForm('/posts/[id]', init);`,
      filename: "pages/x.server.ts",
    },
    {
      // guide/pages-routing/actions-and-forms.md:174-178 (useForm, dynamic routes)
      code: `import { useForm } from '@void/react';\nconst form = useForm('/users/[id]', { name: '' }, { params: { id: '42' } });`,
      filename: "pages/users/[id].tsx",
    },
    {
      // guide/type-safety.md:126-127 (named actions)
      code: `${head}const updateForm = useForm('/users/[id]?update', { name: '' }, { params: { id } });`,
      filename: "pages/users/[id].tsx",
    },
  ],
  invalid: [
    {
      code: `${head}const f = useForm('/posts/[id]', init);`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "params" }],
    },
    {
      code: `${head}const f = useForm('/posts/[id]', init, { preserveScroll: true });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "params" }],
    },
  ],
});
