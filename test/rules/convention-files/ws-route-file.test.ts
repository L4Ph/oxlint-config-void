import rule from "../../../src/plugin/rules/convention-files/ws-route-file.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineRoom, defineWebSocket } from 'void/ws';\n";

new RuleTester().run("ws-route-file", rule, {
  valid: [
    { code: `${IMPORT}export default defineRoom({ messages });`, filename: "routes/chat.ws.ts" },
    { code: "export const x = 1;", filename: "routes/_rooms.ts" },
    {
      code: `${IMPORT}export default defineWebSocket({ messages });`,
      filename: "routes/echo.ws.ts",
    },
    { code: `${IMPORT}export const room = defineRoom({});`, filename: "lib/rooms.ts" },
    // guide/websockets.md line 61 (defineRoom)
    {
      code: `import { defineRoom } from 'void/ws';\n\nexport default defineRoom({\n  messages: { client: ClientMessage, server: ServerMessage },\n  onBeforeConnect(ctx) {\n    if (!ctx.user) {\n      return new Response('Unauthorized', { status: 401 });\n    }\n  },\n});`,
      filename: "routes/chat/[room].ws.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export default defineRoom({ messages });`,
      filename: "routes/chat.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}export default defineWebSocket({ messages });`,
      filename: "lib/chat.ws.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}export const room = defineRoom({ messages });`,
      filename: "routes/chat.ws.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default { messages };",
      filename: "routes/chat.ws.ts",
      errors: [{ messageId: "plain" }],
    },
  ],
});
