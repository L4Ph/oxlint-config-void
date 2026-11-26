import rule from "../../../src/plugin/rules/realtime/ws-cookie-origin-check.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineRoom } from 'void/ws';\n";

new RuleTester().run("ws-cookie-origin-check", rule, {
  valid: [
    {
      code: `${head}defineRoom({ messages, onBeforeConnect: (ctx) => { if (ctx.request.headers.get('origin') !== site) return new Response('no', { status: 403 }); const c = ctx.request.headers.get('cookie'); } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, onBeforeConnect: (ctx) => {} });`,
      filename: "routes/chat/[room].ws.ts",
    },
    // the origin is checked by a helper the hook calls
    {
      code: `${head}defineRoom({ messages, onBeforeConnect: (ctx) => { const bad = checkOrigin(ctx.request); const c = ctx.request.headers.get('cookie'); } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, onBeforeConnect: (ctx) => { ctx.request.headers.get('cookie'); } });`,
      filename: "src/room.ts",
    },
    // guide/websockets.md:110: onBeforeConnect that reads ctx.user only
    {
      code: `${head}export default defineRoom({ messages, onBeforeConnect(ctx) { if (!ctx.user) { return new Response('Unauthorized', { status: 401 }); } } });`,
      filename: "routes/notifications.ws.ts",
    },
  ],
  invalid: [
    {
      code: `${head}defineRoom({ messages, onBeforeConnect: (ctx) => { const c = ctx.request.headers.get('cookie'); } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "cookie" }],
    },
    {
      code: `${head}defineRoom({ messages, onBeforeConnect: (ctx) => { getCookie(ctx.request, 's'); } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "cookie" }],
    },
  ],
});
