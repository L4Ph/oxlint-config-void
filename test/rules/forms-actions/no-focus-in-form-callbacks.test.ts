import rule from "../../../src/plugin/rules/forms-actions/no-focus-in-form-callbacks.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { useForm } from '@void/react';\n`;

new RuleTester().run("no-focus-in-form-callbacks", rule, {
  valid: [
    {
      code: `${head}const f = useForm('/x', init, { onSuccess: () => setSent(true) });`,
      filename: "pages/x.tsx",
    },
    {
      code: `${head}useEffect(() => { ref.current?.focus(); }, [sent]);`,
      filename: "pages/x.tsx",
    },
    {
      // Not governed: a server companion.
      code: `${head}const f = useForm('/x', init, { onError: () => ref.current.focus() });`,
      filename: "pages/x.server.ts",
    },
    {
      // guide/pages-routing/actions-and-forms.md:187-198 (React submission callbacks)
      code: `${head}const form = useForm(
  '/users',
  { name: '', email: '' },
  {
    onSuccess: () => setDialogOpen(false),
    onError: (error) => {
      console.error(error);
    },
  },
);`,
      filename: "pages/users.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}const f = useForm('/x', init, { onSuccess: () => { document.getElementById('done')?.focus(); } });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "focus" }],
    },
    {
      code: `${head}const f = useForm('/x', init, { onError: () => ref.current.focus() });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "focus" }],
    },
  ],
});
