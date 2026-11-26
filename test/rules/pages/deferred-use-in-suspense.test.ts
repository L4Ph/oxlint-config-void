import rule from "../../../src/plugin/rules/pages/deferred-use-in-suspense.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { Suspense, use } from 'react';\n";

new RuleTester().run("deferred-use-in-suspense", rule, {
  valid: [
    {
      code:
        IMPORT +
        "export default function P({ usage }) { return <Suspense fallback={null}><Usage usage={usage} /></Suspense>; }\nfunction Usage({ usage }) { return use(usage).n; }",
      filename: "pages/dashboard.tsx",
    },
    {
      code: IMPORT + "function A() { return <Suspense>{null}</Suspense>; }",
      filename: "pages/a.tsx",
    },
    {
      // Not a page: the rule governs files below pages/.
      code: IMPORT + "export default function P({ usage }) { return use(usage).n; }",
      filename: "src/components/usage.tsx",
    },
    {
      // A `use` that does not come from react is not React's.
      code: "import { use } from './mine';\nexport default function P({ usage }) { return use(usage); }",
      filename: "pages/a.tsx",
    },
    {
      // guide/pages-routing/loaders.md:156-175 (React tab of "Handling Deferred State").
      code: `import { Suspense, use } from 'react';
import type { Props } from './dashboard.server';

function Usage({ usage }: Pick<Props, 'usage'>) {
  const resolved = use(usage);
  return <p>{resolved.requests} requests</p>;
}

export default function Dashboard({ projects, usage }: Props) {
  return (
    <div>
      <h1>Projects ({projects.length})</h1>
      <Suspense fallback={<p>Loading usage...</p>}>
        <Usage usage={usage} />
      </Suspense>
    </div>
  );
}`,
      filename: "pages/dashboard.tsx",
    },
  ],
  invalid: [
    {
      code: IMPORT + "export default function P({ usage }) { return use(usage).n; }",
      filename: "pages/dashboard.tsx",
      errors: [{ messageId: "noSuspense" }],
    },
    {
      code: IMPORT + "export default function P(props) { return use(props.usage).n; }",
      filename: "pages/dashboard.tsx",
      errors: [{ messageId: "noSuspense" }],
    },
    {
      code:
        IMPORT +
        "function U({ usage }) { try { return use(usage); } catch (e) { return null; } }\nexport default function P({ usage }) { return <Suspense><U usage={usage} /></Suspense>; }",
      filename: "pages/dashboard.tsx",
      errors: [{ messageId: "tryCatch" }],
    },
  ],
});
