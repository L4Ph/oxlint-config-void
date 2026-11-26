import rule from "../../../src/plugin/rules/placement/route-file-name.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("route-file-name", rule, {
  valid: [
    { code: "export const GET = defineHandler(() => <p>hi</p>);", filename: "routes/home.tsx" },
    { code: "export default defineRoom({ messages });", filename: "routes/chat.ws.tsx" },
    { code: "export {};", filename: "routes/users/[id].ts" },
    { code: "export {};", filename: "pages/docs/[...slug].tsx" },
    { code: "module.exports = {};", filename: "routes/_helpers.cjs" },
    { code: "export {};", filename: "routes/(admin)/users.ts" },
    { code: "export {};", filename: "routes/.well-known/security.txt.ts" },
    // guide/websockets.md line 22 (Route files): chat/[room].ws.ts and notifications.ws.ts
    { code: "export default 1;", filename: "routes/chat/[room].ws.ts" },
    { code: "export default 1;", filename: "routes/notifications.ws.ts" },
    // guide/server-routing.md line 12: routes/[...path].ts and [lang]/about.ts
    { code: "export const GET = 1;", filename: "routes/[...path].ts" },
    { code: "export const GET = 1;", filename: "routes/[lang]/about.ts" },
  ],
  invalid: [
    {
      code: "exports.GET = () => {};",
      filename: "routes/legacy.cjs",
      errors: [{ messageId: "extension" }],
    },
    {
      code: "export const GET = 1;",
      filename: "routes/users/:id.ts",
      errors: [{ messageId: "segment" }],
    },
    { code: "export {};", filename: "pages/users/$id.tsx", errors: [{ messageId: "segment" }] },
    {
      code: "export {};",
      filename: "pages/docs/[slug...].tsx",
      errors: [{ messageId: "segment" }],
    },
  ],
});
