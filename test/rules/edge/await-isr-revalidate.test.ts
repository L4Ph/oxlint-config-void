import rule from "../../../src/plugin/rules/edge/await-isr-revalidate.ts";
import { RuleTester } from "../../rule-tester.ts";

const isr = "import { revalidate } from 'void/isr';\n";

new RuleTester().run("await-isr-revalidate", rule, {
  valid: [
    {
      code: `${isr}export const POST = async () => { await revalidate({ paths: ['/blog'] }); };`,
      filename: "routes/posts.ts",
    },
    {
      code: `${isr}export const POST = async () => { return revalidate({ paths: ['/blog'] }); };`,
      filename: "routes/posts.ts",
    },
    // A promise handed on is the caller's to await.
    {
      code: `${isr}export const POST = (c) => { c.executionCtx.waitUntil(revalidate({ all: true })); };`,
      filename: "routes/posts.ts",
    },
    // A function of the same name that is not Void's.
    {
      code: "import { revalidate } from './mine';\nexport const POST = () => { revalidate(); };",
      filename: "routes/posts.ts",
    },
    // Not a file of routes/, pages/ companions or middleware/.
    {
      code: `${isr}export function purge() { revalidate({ all: true }); }`,
      filename: "src/purge.ts",
    },
    {
      // guide/edge/revalidation.md:128, the on-demand revalidation example.
      code: `import { defineHandler } from 'void';
import { revalidate } from 'void/isr';

export const POST = defineHandler(async (c) => {
  // ... update content in database ...

  // Purge specific pages
  await revalidate({ paths: ['/', '/blog/hello-world'] });

  // Or purge all cached pages
  await revalidate({ all: true });

  return c.json({ ok: true });
});`,
      filename: "routes/revalidate.ts",
    },
  ],
  invalid: [
    {
      code: `${isr}export const POST = async () => { revalidate({ paths: ['/blog'] }); };`,
      filename: "routes/posts.ts",
      errors: [{ messageId: "await" }],
    },
    {
      code: `${isr}export const actions = { save: async () => { revalidate({ all: true }); } };`,
      filename: "pages/blog/index.server.ts",
      errors: [{ messageId: "await" }],
    },
    {
      code: `${isr}export default async function mw(c, next) { revalidate({ all: true }); await next(); }`,
      filename: "middleware/purge.ts",
      errors: [{ messageId: "await" }],
    },
  ],
});
