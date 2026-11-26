import rule from "../../../src/plugin/rules/forms-actions/await-visit-resolve-on-data.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { useRouter, useForm } from '@void/react';\nimport { startTransition } from 'react';\nconst router = useRouter();\n`;

new RuleTester().run("await-visit-resolve-on-data", rule, {
  valid: [
    {
      code: `${head}const form = useForm('/x', {}, { onSuccess: async () => { await router.visit('/y', { resolveOn: 'data' }); } });`,
      filename: "pages/x.tsx",
    },
    {
      code: `${head}startTransition(async () => { await router.refresh({ resolveOn: 'data' }); });`,
      filename: "pages/x.tsx",
    },
    {
      // Not one of the four places: the default waits for the commit, which is right here.
      code: `${head}async function go() { await router.visit('/y'); }`,
      filename: "pages/x.tsx",
    },
    {
      // A file the rule does not govern: a server companion.
      code: `${head}startTransition(async () => { await router.refresh(); });`,
      filename: "pages/x.server.ts",
    },
    {
      // reference/api/pages.md:192-197 (React navigation completion)
      code: `${head}
startTransition(async () => {
  await saveUser();
  await router.refresh({ resolveOn: 'data' });
});

await router.visit('/account', { resolveOn: 'data' });`,
      filename: "pages/account.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}const form = useForm('/x', {}, { onSuccess: async () => { await router.visit('/y'); } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "resolveOn" }],
    },
    {
      code: `${head}startTransition(async () => { await router.refresh(); });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "resolveOn" }],
    },
    {
      code: `${head}export default function F() { return <form action={async () => { await router.visit('/y', { replace: true }); }} />; }`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "resolveOn" }],
    },
  ],
});
