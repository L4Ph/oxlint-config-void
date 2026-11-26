import rule from "../../../src/plugin/rules/realtime/room-action-structured-clone-args.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { getRoom } from 'void/ws/server';\n";

new RuleTester().run("room-action-structured-clone-args", rule, {
  valid: [
    { code: `${head}await getRoom('a').actions.kick('u1');`, filename: "routes/api.ts" },
    {
      code: `${head}const room = getRoom('a');\nawait room.actions.set({ a: 1 });`,
      filename: "src/kick.ts",
    },
    // built-ins the structured clone algorithm copies
    { code: `${head}await getRoom('a').actions.at(new Date());`, filename: "routes/api.ts" },
    // an object that did not come from getRoom
    { code: "await queue.actions.add(new Thing());", filename: "routes/api.ts" },
    // guide/websockets.md:209
    {
      code: `${head}const room = getRoom('/relay/[accountId]', { params: { accountId } });\nconst { closed } = await room.actions.revokeSession(session.id, 4001);`,
      filename: "routes/api/revoke.ts",
    },
  ],
  invalid: [
    {
      code: `${head}await getRoom('a').actions.each(() => {});`,
      filename: "routes/api.ts",
      errors: [{ messageId: "argument" }],
    },
    {
      code: `${head}const room = getRoom('a');\nawait room.actions.add(new Thing());`,
      filename: "routes/api.ts",
      errors: [{ messageId: "argument" }],
    },
  ],
});
