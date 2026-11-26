import rule from "../../../src/plugin/rules/realtime/room-action-definitions.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineRoom } from 'void/ws';\n";

new RuleTester().run("room-action-definitions", rule, {
  valid: [
    {
      code: `${head}defineRoom({ messages, actions: { kick: (ctx, userId: string) => {} } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, actions: { ping: (ctx) => {} } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, actions: { kick: (ctx, id: string) => ctx.room.kick(id) } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, onBeforeConnect: (ctx) => ctx.user });`,
      filename: "routes/chat/[room].ws.ts",
    },
    // JavaScript has no annotations
    {
      code: `${head}defineRoom({ messages, actions: { kick: (ctx, id) => {} } });`,
      filename: "routes/chat/[room].ws.js",
    },
    // not a route file
    {
      code: `${head}defineRoom({ messages, actions: { kick: (ctx, id) => {} } });`,
      filename: "src/room.ts",
    },
    // guide/websockets.md:185
    {
      code: `${head}export default defineRoom({
  messages: { client: ClientMessage, server: ServerMessage },
  actions: {
    async revokeSession(ctx, sessionId: string, code: number) {
      let closed = 0;
      for (const connection of ctx.room.getConnections()) { connection.close(code, 'session revoked'); closed += 1; }
      return { closed };
    },
    async announce(ctx, text: string) { await ctx.room.broadcast({ type: 'relay.message', text }); },
  },
});`,
      filename: "routes/relay/[accountId].ws.ts",
    },
  ],
  invalid: [
    {
      code: `${head}defineRoom({ messages, actions: { kick: (ctx, userId) => {} } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "annotate" }],
    },
    {
      code: `${head}defineRoom({ messages, actions: { move: (ctx, x: number, y) => {} } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "annotate" }],
    },
    {
      code: `${head}defineRoom({ messages, actions: { kick: (ctx, id: string) => ctx.user.id } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "noRequest" }],
    },
    {
      code: `${head}defineRoom({ messages, actions: { a: (ctx) => ctx.request.headers } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "noRequest" }],
    },
  ],
});
