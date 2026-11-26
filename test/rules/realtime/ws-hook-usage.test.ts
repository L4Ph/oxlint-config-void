import rule from "../../../src/plugin/rules/realtime/ws-hook-usage.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineRoom, defineWebSocket } from 'void/ws';\n";

new RuleTester().run("ws-hook-usage", rule, {
  valid: [
    {
      code: `${head}defineRoom({ messages, onClose: (ctx) => { cleanup(ctx); } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, onMessage: (ctx) => { ctx.connection.close(); } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, onConnect: (ctx) => { ctx.connection.setState({ ua: ctx.request.headers.get('user-agent') }); } });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, onMessage: (ctx) => ctx.connection.state });`,
      filename: "routes/chat/[room].ws.ts",
    },
    {
      code: `${head}defineRoom({ messages, onClose: (ctx) => { ctx.socket.close(); } });`,
      filename: "src/room.ts",
    },
    // the URL of the placeholder request is not said to be empty
    {
      code: `${head}defineRoom({ messages, onClose: (ctx) => ctx.request.url });`,
      filename: "routes/chat/[room].ws.ts",
    },
    // guide/websockets.md:161: close in onMessage
    {
      code: `${head}defineWebSocket({ messages, onMessage(ctx, event) { if (banned(ctx.user)) ctx.socket.close(); } });`,
      filename: "routes/chat.ws.ts",
    },
  ],
  invalid: [
    {
      code: `${head}defineRoom({ messages, onClose: (ctx) => { ctx.connection.close(); } });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "close" }],
    },
    {
      code: `${head}defineWebSocket({ messages, onClose: (ctx) => { ctx.socket.close(); } });`,
      filename: "routes/chat.ws.ts",
      errors: [{ messageId: "close" }],
    },
    {
      code: `${head}defineRoom({ messages, onMessage: (ctx) => ctx.request.headers.get('x') });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "request" }],
    },
    {
      code: `${head}defineRoom({ messages, onClose: (ctx) => ctx.request.cookies });`,
      filename: "routes/chat/[room].ws.ts",
      errors: [{ messageId: "request" }],
    },
  ],
});
