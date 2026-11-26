import rule from "../../../src/plugin/rules/realtime/live-distinct-subscription-ids.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("live-distinct-subscription-ids", rule, {
  valid: [
    {
      code: "stream.subscribe({ id: 'a', topic: 'x' });\nstream.subscribe({ id: 'b', topic: 'y' });",
      filename: "pages/feed.tsx",
    },
    { code: "a.subscribe({ id: 'a' });\nb.subscribe({ id: 'a' });", filename: "pages/feed.tsx" },
    // a kept handle can be called before the id is used again
    {
      code: "async function f() { const off = await stream.subscribe({ id: 'a' }); await off(); await stream.subscribe({ id: 'a' }); }",
      filename: "pages/feed.tsx",
    },
    // calls in different branches never both run
    {
      code: "if (x) { stream.subscribe({ id: 'a' }); } else { stream.subscribe({ id: 'a' }); }",
      filename: "src/feed.ts",
    },
    // guide/live.md:59
    {
      code: `async function f() {
  const unsubscribePost = await stream.subscribe({ id: 'post-card', topic: 'post:12', onEvent(event) {} });
  const unsubscribeComments = await stream.subscribe({ id: 'comments', topic: 'comment:2323' });
}`,
      filename: "pages/_lib/live.ts",
    },
  ],
  invalid: [
    {
      code: "stream.subscribe({ id: 'a', topic: 'x' });\nstream.subscribe({ id: 'a', topic: 'y' });",
      filename: "pages/feed.tsx",
      errors: [{ messageId: "reused" }],
    },
    {
      code: "conn.subscribe({ id: 'room' });\nconn.subscribe({ id: 'room', topic: 'z' });",
      filename: "src/feed.ts",
      errors: [{ messageId: "reused" }],
    },
    {
      code: "async function f() { await live.client.subscribe({ id: 'a' }); await live.client.subscribe({ id: 'a' }); }",
      filename: "src/feed.ts",
      errors: [{ messageId: "reused" }],
    },
  ],
});
