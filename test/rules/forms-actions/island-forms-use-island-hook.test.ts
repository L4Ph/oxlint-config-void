import rule from "../../../src/plugin/rules/forms-actions/island-forms-use-island-hook.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("island-forms-use-island-hook", rule, {
  valid: [
    {
      code: `import { useIslandForm } from '@void/react';\nconst form = useIslandForm({ title: '' });\nform.post('/blog');`,
      filename: "pages/blog/new.island.tsx",
    },
    { code: `import { useIslandForm } from '@void/react';`, filename: "pages/blog/new.island.tsx" },
    {
      // Not an island file.
      code: `import { useForm } from '@void/react';`,
      filename: "pages/blog/new.tsx",
    },
    {
      // guide/pages-routing/islands.md:218-227 (Forms, React)
      code: `import { useIslandForm } from '@void/react';
export default function PostForm() {
  const form = useIslandForm({ title: '', body: '' });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        return form.post('/blog');
      }}
    />
  );
}`,
      filename: "pages/blog/new.island.tsx",
    },
  ],
  invalid: [
    {
      code: `import { useForm } from '@void/react';`,
      filename: "pages/blog/new.island.tsx",
      errors: [{ messageId: "hook" }],
    },
    {
      code: `import { Form, useIslandForm } from '@void/svelte';`,
      filename: "pages/blog/new.island.tsx",
      errors: [{ messageId: "hook" }],
    },
    {
      code: `import { useIslandForm } from '@void/react';\nconst form = useIslandForm({ title: '' });\nform.post();`,
      filename: "pages/blog/new.island.tsx",
      errors: [{ messageId: "url" }],
    },
  ],
});
