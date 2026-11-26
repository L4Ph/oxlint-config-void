import rule from "../../../src/plugin/rules/forms-actions/narrow-action-error.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { action, useForm, isVoidActionError } from '@void/react';\n`;

new RuleTester().run("narrow-action-error", rule, {
  valid: [
    {
      code: `${head}try { await action('/x', b); } catch (e) { if (isVoidActionError(e)) show(e.status); }`,
      filename: "pages/x.tsx",
    },
    {
      code: `${head}try { await action('/x', b); } catch (e) { log(e); }`,
      filename: "pages/x.tsx",
    },
    {
      // The try does not call action(): a FetchError has its own status.
      code: `${head}try { await load(); } catch (e) { show(e.status); }`,
      filename: "pages/x.tsx",
    },
    {
      // Not governed: a server companion.
      code: `${head}try { await action('/x', b); } catch (e) { show(e.status); }`,
      filename: "pages/x.server.ts",
    },
    {
      // guide/pages-routing/actions-and-forms.md:343-353 (Validation Errors)
      code: `import { isVoidActionError } from '@void/react';

function describeError(error: unknown) {
  if (isVoidActionError(error)) {
    if (error.status === 401) return 'Please sign in again.';
    if (error.status === 403) return error.message;
  }
  return 'Something went wrong.';
}`,
      filename: "pages/x.tsx",
    },
  ],
  invalid: [
    {
      code: `${head}try { await action('/x', b); } catch (e) { show(e.status); }`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "narrow" }],
    },
    {
      code: `${head}const f = useForm('/x', init, { onError: (e) => show(e.status) });`,
      filename: "pages/x.tsx",
      errors: [{ messageId: "narrow" }],
    },
  ],
});
