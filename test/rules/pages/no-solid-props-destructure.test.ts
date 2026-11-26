import rule from "../../../src/plugin/rules/pages/no-solid-props-destructure.ts";
import { RuleTester } from "../../rule-tester.ts";

const SOLID = "import { createMemo } from 'solid-js';\n";

new RuleTester().run("no-solid-props-destructure", rule, {
  valid: [
    {
      code: SOLID + "export default function A(props) { return <p>{props.name}</p>; }",
      filename: "pages/a.tsx",
    },
    {
      code:
        SOLID +
        "export default function B(props) { const n = createMemo(() => props.name); return <p>{n()}</p>; }",
      filename: "pages/b.tsx",
    },
    {
      // React components destructure freely.
      code: "export default function A({ name }) { return <p>{name}</p>; }",
      filename: "pages/a.tsx",
    },
    {
      code: SOLID + "export default function A({ name }) { return <p>{name}</p>; }",
      filename: "src/a.tsx",
    },
    {
      // A callback of a list component is not the page.
      code:
        SOLID +
        "export default function A(props) { return <For each={props.rows}>{({ id }) => <li>{id}</li>}</For>; }",
      filename: "pages/a.tsx",
    },
    {
      // guide/pages-routing/loaders.md:110-118 (Solid tab)
      code: `import { For } from 'solid-js';
import type { Props } from './index.server';

export default function UsersPage(props: Props) {
  return (
    <>
      <h1>Users</h1>
      <ul>
        <For each={props.users}>{(u) => <li>{u.name}</li>}</For>
      </ul>
    </>
  );
}`,
      filename: "pages/users/index.tsx",
    },
  ],
  invalid: [
    {
      code: SOLID + "export default function A({ name }) { return <p>{name}</p>; }",
      filename: "pages/a.tsx",
      errors: [{ messageId: "destructure" }],
    },
    {
      code:
        SOLID +
        "export default function B(props) { const name = props.name; return <p>{name}</p>; }",
      filename: "pages/b.tsx",
      errors: [{ messageId: "copy" }],
    },
  ],
});
