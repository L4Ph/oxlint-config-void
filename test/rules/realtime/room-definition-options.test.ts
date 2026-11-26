import rule from "../../../src/plugin/rules/realtime/room-definition-options.ts";
import { RuleTester } from "../../rule-tester.ts";

const ws = "import { defineRoom, defineWebSocket } from 'void/ws';\n";
const durable = "import { defineDurableState } from 'void/durable';\n";

new RuleTester().run("room-definition-options", rule, {
  valid: [
    {
      code: `${ws}export default defineRoom({ messages: { client: z.object({}), server: z.object({}) } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${ws}export default defineWebSocket({ messages });`,
      filename: "routes/notifications.ws.ts",
    },
    {
      code: `${ws}defineRoom({ messages, key: (params) => params.roomId });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${ws}defineWebSocket({ messages, key: ({ id }) => \`user-\${id}\` });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${durable}defineDurableState({ name: 'shopping-cart' });`,
      filename: "durable-objects/cart.ts",
    },
    // a name bound to a const string, and an imported one that is not looked into
    {
      code: `${ws}const NAME = 'chat-room';\ndefineRoom({ name: NAME, messages });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${ws}defineRoom({ name: ROOM_NAME, messages });`,
      filename: "routes/chat/[room].ws.ts",
    },
    // not a WebSocket route
    { code: `${ws}defineRoom({});`, filename: "src/room.ts" },
    // guide/websockets.md:287
    {
      code: `${ws}export default defineRoom({
  name: 'chat-room',
  key: ({ params }) => \`room=\${params.id}\`,
  messages: { client: ClientMessage, server: ServerMessage },
});`,
      filename: "routes/rooms/[id].ws.ts",
    },
    // guide/durable-state.md:141
    {
      code: `${durable}export const Counter = defineDurableState({ name: 'counter', initialState: { count: 0 }, methods: { read(context) { return context.state.count; } } });`,
      filename: "durable-objects/counter.ts",
    },
  ],
  invalid: [
    {
      code: `${ws}export default defineRoom({});`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "messages" }],
    },
    {
      code: `${ws}export default defineWebSocket({ messages: { client: z.object({}) } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "messages" }],
    },
    {
      code: `${ws}defineRoom({ messages, key: async (p) => p.roomId });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "key" }],
    },
    {
      code: `${ws}defineRoom({ messages, key: () => crypto.randomUUID() });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "key" }],
    },
    {
      code: `${ws}defineRoom({ name: \`chat-\${id}\`, messages });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "name" }],
    },
    {
      code: `${durable}defineDurableState({ name: 'Shopping_Cart' });`,
      filename: "durable-objects/cart.ts",
      errors: [{ messageId: "words" }],
    },
  ],
});
