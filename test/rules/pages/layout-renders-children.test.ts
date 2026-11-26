import rule from "../../../src/plugin/rules/pages/layout-renders-children.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("layout-renders-children", rule, {
  valid: [
    {
      code: "export default function Layout({ children }) { return <main>{children}</main>; }",
      filename: "pages/layout.tsx",
    },
    {
      code: "export default function L(props) { return <div>{props.children}</div>; }",
      filename: "pages/_layouts/landing.tsx",
    },
    {
      // Not a layout file.
      code: "export default function Page() { return <main />; }",
      filename: "pages/about.tsx",
    },
    {
      // A Vue or Svelte layout keeps `<slot />` in a template the linter does not see.
      code: "export default {};",
      filename: "pages/layout.vue",
    },
    {
      // guide/pages-routing/layouts.md:124-142 (Solid tab)
      code: `import { useShared, Link } from '@void/solid';
import type { JSX } from 'solid-js';

export default function Layout(props: { children: JSX.Element }) {
  const shared = useShared();
  return (
    <>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/users">Users</Link>
        {shared.auth?.user && <span>{shared.auth.user.name}</span>}
      </nav>
      <main>{props.children}</main>
    </>
  );
}`,
      filename: "pages/layout.tsx",
    },
  ],
  invalid: [
    {
      code: "export default function Layout() { return <main />; }",
      filename: "pages/layout.tsx",
      errors: [{ messageId: "children" }],
    },
    {
      code: "export default function L() { return null; }",
      filename: "pages/_layouts/landing.tsx",
      errors: [{ messageId: "children" }],
    },
  ],
});
