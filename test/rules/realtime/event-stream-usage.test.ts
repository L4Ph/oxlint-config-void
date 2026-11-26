import rule from "../../../src/plugin/rules/realtime/event-stream-usage.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { eventStream } from 'void/sse';\n";

new RuleTester().run("event-stream-usage", rule, {
  valid: [
    {
      code: `${head}export const GET = defineHandler((c) => eventStream(c, async (stream) => { await stream.closed; }));`,
      filename: "routes/feed.ts",
    },
    { code: `${head}function f(c) { return eventStream(c, start); }`, filename: "routes/feed.ts" },
    {
      code: `${head}function f(c) { return eventStream(c, async (stream) => { const t = setInterval(() => stream.send({ data: 1 }), 1000); await stream.closed; clearInterval(t); }); }`,
      filename: "routes/feed.ts",
    },
    {
      code: `${head}function f(c) { return eventStream(c, async (stream) => { await stream.send({ data: 1 }); }); }`,
      filename: "routes/feed.ts",
    },
    // a start callback that hands back a promise keeps the stream open
    {
      code: `${head}function f() { return eventStream((stream) => new Promise((resolve) => { setTimeout(resolve, 10); })); }`,
      filename: "routes/feed.ts",
    },
    // not a route file
    { code: `${head}eventStream(start);`, filename: "pages/feed.tsx" },
    // guide/sse.md:21
    {
      code: `${head}export const GET = defineHandler((c) => {
  return eventStream(
    async (stream) => {
      await stream.comment('connected');
      await stream.send({ event: 'ready', data: { now: Date.now() } });
      const timer = setInterval(() => {
        void stream.send({ event: 'tick', data: { now: Date.now() } }).catch(() => stream.close());
      }, 1000);
      await stream.closed;
      clearInterval(timer);
    },
    { signal: c.req.raw.signal },
  );
});`,
      filename: "routes/api/events.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const GET = defineHandler((c) => { eventStream(c, start); return c.text('ok'); });`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "discarded" }],
    },
    {
      code: `${head}export const GET = defineHandler((c) => c.json(eventStream(c, start)));`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "discarded" }],
    },
    {
      code: `${head}function f() { const response = eventStream(start); return c.text('ok'); }`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "discarded" }],
    },
    {
      code: `${head}function f(c) { return eventStream(c, async (stream) => { setInterval(() => stream.send({ data: 1 }), 1000); }); }`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "returns" }],
    },
    {
      code: `${head}function f(c) { return eventStream(c, (stream) => { emitter.on('x', (d) => stream.send({ data: d })); }); }`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "returns" }],
    },
  ],
});
