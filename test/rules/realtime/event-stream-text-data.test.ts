import rule from "../../../src/plugin/rules/realtime/event-stream-text-data.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { eventStream } from 'void/sse';\n";

new RuleTester().run("event-stream-text-data", rule, {
  valid: [
    { code: `${head}stream.send({ data: { a: 1 } });`, filename: "routes/feed.ts" },
    { code: `${head}stream.send({ data: 'text' });`, filename: "routes/feed.ts" },
    // a file that is not a route, and a file with no SSE
    { code: `${head}stream.send({ data: new Uint8Array(4) });`, filename: "src/feed.ts" },
    { code: "socket.send({ data: new Uint8Array(4) });", filename: "routes/feed.ts" },
    { code: `${head}const text = 'x';\nstream.send({ data: text });`, filename: "routes/feed.ts" },
    // guide/sse.md:59
    {
      code: `${head}await stream.send({ id: 'evt_1', event: 'post.update', retry: 1000, data: { id: 'post_123', likes: 10 } });`,
      filename: "routes/events.ts",
    },
  ],
  invalid: [
    {
      code: `${head}stream.send({ data: new Uint8Array(4) });`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "binary" }],
    },
    {
      code: `${head}stream.send({ data: await blob.arrayBuffer() });`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "binary" }],
    },
    {
      code: `${head}const buffer = new ArrayBuffer(8);\nstream.send({ data: buffer });`,
      filename: "routes/feed.ts",
      errors: [{ messageId: "binary" }],
    },
  ],
});
