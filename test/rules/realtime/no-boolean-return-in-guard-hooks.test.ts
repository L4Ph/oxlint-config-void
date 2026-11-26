import rule from "../../../src/plugin/rules/realtime/no-boolean-return-in-guard-hooks.ts";
import { RuleTester } from "../../rule-tester.ts";

const ws = "import { defineRoom } from 'void/ws';\n";
const live = "import { defineLiveStream } from 'void/live';\n";

new RuleTester().run("no-boolean-return-in-guard-hooks", rule, {
  valid: [
    {
      code: `${ws}defineRoom({ messages, onBeforeConnect: (ctx) => { if (!ctx.user) return new Response('no', { status: 401 }); } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${live}defineLiveStream({ id: 'a', onSubscribe: () => {} });`,
      filename: "src/live.ts",
    },
    // other hooks may return what they like, and other functions are not Void's
    {
      code: `${ws}defineRoom({ messages, onMessage: () => false });`,
      filename: "routes/chat/[room].ws.ts",
    },
    { code: "defineRoom({ onBeforeConnect: () => false });", filename: "routes/chat/[room].ws.ts" },
    // guide/live.md:140
    {
      code: `${live}export const live = defineLiveStream({
  id: 'app',
  async onSubscribe(ctx) {
    const post = /^post:(.+)$/.exec(ctx.topic);
    if (post && (await canReadPost(ctx.env, ctx.user, post[1]))) return;
    return new Response('Forbidden', { status: 403 });
  },
});`,
      filename: "src/live.ts",
    },
  ],
  invalid: [
    {
      code: `${ws}defineRoom({ messages, onBeforeConnect: (ctx) => !!ctx.user });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "verdict" }],
    },
    {
      code: `${live}defineLiveStream({ id: 'a', onSubscribe: ({ topic }) => { return false; } });`,
      filename: "src/live.ts",
      errors: [{ messageId: "verdict" }],
    },
    {
      code: `${ws}defineRoom({ messages, onBeforeConnect(ctx) { if (!ctx.user) return 'no'; return null; } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "verdict" }, { messageId: "verdict" }],
    },
  ],
});
