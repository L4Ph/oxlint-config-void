import rule from "../../../src/plugin/rules/forms-actions/handle-action-result.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { action } from '@void/react';\n`;

new RuleTester().run("handle-action-result", rule, {
  valid: [
    {
      code: `${head}const r = await action('/x', body);\nif (!r.ok) setError(r.error);`,
      filename: "pages/x.tsx",
    },
    { code: `${head}const r = await action('/x', body);\nreturn r;`, filename: "pages/x.tsx" },
    {
      // Not governed: a server companion.
      code: `${head}const r = await action('/x', body);\nuse(r.pageData);`,
      filename: "pages/x.server.ts",
    },
    {
      // The docs write a bare call in their examples (actions-and-forms.md:246), so it is not reported.
      code: `${head}await action('/items?vote');`,
      filename: "pages/items.tsx",
    },
    {
      // guide/pages-routing/actions-and-forms.md:309-315 (Actions)
      code: `${head}
const result = await action('/users/[id]?delete', {
  params: { id: '42' },
  method: 'DELETE',
});
if (!result.ok) {
  showToast(result.error.message);
}`,
      filename: "pages/users/[id].tsx",
    },
  ],
  invalid: [
    {
      code: `${head}const r = await action('/x', body);\nuse(r.pageData);`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "unchecked" }],
    },
    {
      code: `import { action } from '@void/vue';\nconst result = await action('/x?delete', { method: 'DELETE' });\nrender(result.pageData.items);`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "unchecked" }],
    },
  ],
});
