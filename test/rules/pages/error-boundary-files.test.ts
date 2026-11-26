import rule from "../../../src/plugin/rules/pages/error-boundary-files.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("error-boundary-files", rule, {
  valid: [
    {
      code: "export default function NotFound({ error }) { return <p>{error.message}</p>; }",
      filename: "pages/_not-found.tsx",
    },
    { code: "export default function E() { return null; }", filename: "pages/_error.tsx" },
    {
      code: "import type { ErrorPageProps } from '@void/react';\nexport default function E({ error }: ErrorPageProps) { return null; }",
      filename: "pages/_error.tsx",
    },
    {
      code: "import type { ErrorPageProps } from '@void/react';\nexport default function N(props: ErrorPageProps) { return null; }",
      filename: "pages/_not-found.tsx",
    },
    {
      // Not a boundary: an ordinary page may have a companion and a layout export.
      code: "export const loader = defineHandler(() => ({}));",
      filename: "pages/about.server.ts",
    },
    {
      code: "export const layout = 'landing';\nexport default function A() { return null; }",
      filename: "pages/about.tsx",
    },
    {
      // guide/pages-routing/errors.md:13-25 (React tab)
      code: `import type { ErrorPageProps } from '@void/react';

export default function ErrorPage({ error }: ErrorPageProps) {
  return (
    <main>
      <h1>{error.status}</h1>
      <p>{error.message}</p>
      <a href="/">Go home</a>
    </main>
  );
}`,
      filename: "pages/_error.tsx",
    },
  ],
  invalid: [
    {
      code: "export const loader = defineHandler(() => ({}));",
      filename: "pages/_not-found.server.ts",
      errors: [{ messageId: "companion" }],
    },
    {
      code: "export const loader = defineHandler(() => ({}));",
      filename: "pages/docs/_error.server.ts",
      errors: [{ messageId: "companion" }],
    },
    {
      code: "export const layout = 'landing';\nexport default function E() { return null; }",
      filename: "pages/_error.tsx",
      errors: [{ messageId: "layout" }],
    },
    {
      code: "export default function N(props: { error: Error }) { return null; }",
      filename: "pages/_not-found.tsx",
      errors: [{ messageId: "props" }],
    },
  ],
});
