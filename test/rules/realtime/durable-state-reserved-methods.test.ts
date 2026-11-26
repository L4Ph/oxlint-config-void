import rule from "../../../src/plugin/rules/realtime/durable-state-reserved-methods.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineDurableState } from 'void/durable';\n";

new RuleTester().run("durable-state-reserved-methods", rule, {
  valid: [
    {
      code: `${head}defineDurableState({ methods: { add() {} }, alarm() {} });`,
      filename: "durable-objects/counter.ts",
    },
    { code: `${head}defineDurableState({ methods: {} });`, filename: "durable-objects/counter.ts" },
    {
      code: `${head}defineDurableState({ methods: { fetch() {} } });`,
      filename: "routes/not-a-durable-object.ts",
    },
    // guide/durable-state.md:71
    {
      code: `${head}export const Room = defineDurableState({
  initialState: { wakeups: 0 },
  methods: {},
  fetch(context) { return Response.json(context.state); },
  async alarm(context) { context.state.wakeups += 1; await context.setAlarm(Date.now() + 60_000); },
});`,
      filename: "durable-objects/room.ts",
    },
  ],
  invalid: [
    {
      code: `${head}defineDurableState({ methods: { alarm() {} } });`,
      filename: "durable-objects/counter.ts",
      errors: [{ messageId: "reserved" }],
    },
    {
      code: `${head}defineDurableState({ methods: { fetch() {} } });`,
      filename: "durable-objects/counter.ts",
      errors: [{ messageId: "reserved" }],
    },
    {
      code: `${head}defineDurableState({ methods: { constructor() {}, 'alarm': () => {} } });`,
      filename: "durable-objects/counter.ts",
      errors: [{ messageId: "reserved" }, { messageId: "reserved" }],
    },
  ],
});
