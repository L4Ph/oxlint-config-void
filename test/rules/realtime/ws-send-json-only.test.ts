import rule from "../../../src/plugin/rules/realtime/ws-send-json-only.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("ws-send-json-only", rule, {
  valid: [
    { code: "ctx.room.broadcast({ type: 'hello' });", filename: "routes/chat/[room].ws.ts" },
    { code: "ctx.connection.send({ type: 'pong' });", filename: "routes/chat/[room].ws.ts" },
    { code: "ctx.socket.send('hello');", filename: "src/socket.ts" },
    {
      code: "ctx.room.broadcast(event, [ctx.connection.id]);",
      filename: "routes/chat/[room].ws.ts",
    },
    // guide/websockets.md:116
    {
      code: "async function onConnect(ctx) { await ctx.socket.send({ type: 'notifications.item', title: 'Connected' }); }",
      filename: "routes/notifications.ws.ts",
    },
  ],
  invalid: [
    {
      code: "ctx.room.broadcast('hello');",
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "raw" }],
    },
    {
      code: "ctx.connection.send(new Uint8Array([1]));",
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "raw" }],
    },
    {
      code: "ctx.socket.send(`hi ${name}`);",
      filename: "routes/chat.ws.ts",
      errors: [{ messageId: "raw" }],
    },
  ],
});
