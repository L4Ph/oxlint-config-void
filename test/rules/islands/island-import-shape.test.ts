import rule from "../../../src/plugin/rules/islands/island-import-shape.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("island-import-shape", rule, {
  valid: [
    {
      code: "import Counter from './_Counter' with { island: 'load' };",
      filename: "pages/blog.island.tsx",
    },
    {
      code: "import Chart from './_components/Chart' with { island: 'visible' };",
      filename: "pages/blog/index.island.tsx",
    },
    { code: "import C from './_C' with { island: 'load' };", filename: "pages/blog.island.tsx" },
    {
      // No island attribute: an ordinary import in an ordinary page.
      code: "import { x } from './_x';",
      filename: "pages/about.tsx",
    },
    { code: "import C from './_C' with { island: 'visible' };", filename: "pages/x.island.tsx" },
    {
      // A component outside pages/ is not a route.
      code: "import Chart from '../../components/Chart' with { island: 'idle' };",
      filename: "pages/blog/index.island.tsx",
    },
    {
      // Not under pages/.
      code: "import C from './C' with { island: 'hover' };",
      filename: "src/x.tsx",
    },
    {
      // guide/pages-routing/islands.md:184-188
      code: `import Comments from './_Comments' with { island: 'visible' };
import CookieBanner from './_CookieBanner' with { island: 'idle' };
import MobileMenu from './_MobileMenu' with { island: 'media:(max-width: 768px)' };`,
      filename: "pages/blog/index.island.tsx",
    },
    {
      // guide/pages-routing/islands.md:78-80
      code: `import Counter from './_Counter' with { island: 'load' };
import PostForm from './_PostForm' with { island: 'visible' };

export default function BlogIndex({ posts }) {
  return <div><Counter /><PostForm /></div>;
}`,
      filename: "pages/blog/index.island.tsx",
    },
  ],
  invalid: [
    {
      code: "import Counter from './Counter' with { island: 'load' };",
      filename: "pages/blog.island.tsx",
      errors: [{ messageId: "route" }],
    },
    {
      code: "import Chart from './widgets/Chart' with { island: 'idle' };",
      filename: "pages/blog.island.tsx",
      errors: [{ messageId: "route" }],
    },
    {
      code: "import C from './_C' with { island: 'load' };",
      filename: "pages/blog.tsx",
      errors: [{ messageId: "page" }],
    },
    {
      code: "import C from './_C' with { island: 'idle' };",
      filename: "pages/home.tsx",
      errors: [{ messageId: "page" }],
    },
    {
      code: "import C from './_C' with { island: 'hover' };",
      filename: "pages/home.island.tsx",
      errors: [{ messageId: "strategy" }],
    },
  ],
});
