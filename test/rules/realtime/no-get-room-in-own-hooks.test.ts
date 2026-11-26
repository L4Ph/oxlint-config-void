import rule from "../../../src/plugin/rules/realtime/no-get-room-in-own-hooks.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineRoom } from 'void/ws';\nimport { getRoom } from 'void/ws/server';\n";

new RuleTester().run("no-get-room-in-own-hooks", rule, {
  valid: [
    {
      code: `${head}export default defineRoom({ messages, onMessage: (ctx) => ctx.room.broadcast({ t: 1 }) });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: "import { getRoom } from 'void/ws/server';\ngetRoom('/chat/[room]', { params }).actions.kick('u');",
      filename: "routes/api.ts",
    },
    // another room's actions can be called from a hook
    {
      code: `${head}export default defineRoom({ messages, onMessage: (ctx) => getRoom('/lobby/[id]', { params }).actions.ping() });`,
      filename: "routes/chat/[room].ws.ts",
    },
    // guide/websockets.md:209: getRoom in other server code
    {
      code: "import { getRoom } from 'void/ws/server';\nconst room = getRoom('/relay/[accountId]', { params: { accountId } });\nconst { closed } = await room.actions.revokeSession(session.id, 4001);",
      filename: "routes/api/revoke.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export default defineRoom({ messages, onMessage: (ctx) => getRoom('/chat/[room]', { params: ctx.params }).actions.kick('u') });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "self" }],
    },
    {
      code: `${head}export default defineRoom({ messages, onConnect(ctx) { getRoom('/rooms', {}); } });`,
      filename: "routes/rooms/index.ws.ts",
      errors: [{ messageId: "self" }],
    },
  ],
});
