import rule from "../../../src/plugin/rules/realtime/format-sse-text.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("format-sse-text", rule, {
  valid: [
    {
      code: "function f() { return new Response(formatSseText(payload), { headers }); }",
      filename: "routes/feed.ts",
    },
    { code: "function f(c) { return c.text('hello'); }", filename: "routes/feed.ts" },
    {
      code: "function f() { return new Response(`data: ${payload}\\n\\n`); }",
      filename: "pages/feed.server.ts",
    },
    // data: with no frame end is ordinary text
    { code: "function f() { return new Response('data: 1'); }", filename: "routes/feed.ts" },
    // guide/sse.md:78
    {
      code: "const frame = formatSseText({ event: 'post.update', data: JSON.stringify({ id: 'post_123', likes: 10 }) });",
      filename: "routes/api/frame.ts",
    },
  ],
  invalid: [
    {
      code: "function f() { return new Response(`data: ${payload}\\n\\n`, { headers }); }",
      filename: "routes/feed.ts",
      errors: [{ messageId: "frame" }],
    },
    {
      code: "function f() { return new Response('event: ping\\ndata: 1\\n\\n'); }",
      filename: "routes/feed.ts",
      errors: [{ messageId: "frame" }],
    },
    {
      code: "const frame = () => 'data: 1\\n\\n';",
      filename: "routes/feed.ts",
      errors: [{ messageId: "frame" }],
    },
  ],
});
