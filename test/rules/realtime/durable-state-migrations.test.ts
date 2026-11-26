import rule from "../../../src/plugin/rules/realtime/durable-state-migrations.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineDurableState } from 'void/durable';\n";

new RuleTester().run("durable-state-migrations", rule, {
  valid: [
    {
      code: `${head}defineDurableState({ version: 2, migrations: [{ version: 1, up }, { version: 2, up }] });`,
      filename: "durable-objects/counter.ts",
    },
    {
      code: `${head}defineDurableState({ version: 1, migrations: [{ version: 1, up }] });`,
      filename: "durable-objects/counter.ts",
    },
    // not a durable-objects file
    {
      code: `${head}defineDurableState({ migrations: [{ version: 2, up }] });`,
      filename: "routes/api/counter.ts",
    },
    // versions that are not literals are not checked
    {
      code: `${head}defineDurableState({ version: V, migrations: [{ version: A, up }] });`,
      filename: "durable-objects/counter.ts",
    },
    // guide/durable-state.md:92
    {
      code: `${head}export const Counter = defineDurableState({
  initialState: { count: 0, label: 'Counter' },
  version: 2,
  migrations: [
    { version: 1, migrate(old) { return { count: (old as { count: number }).count, label: 'Counter' }; } },
    { version: 2, migrate(old) { return { ...(old as { count: number; label: string }), label: 'Total' }; } },
  ],
  methods: { read(context) { return context.state; } },
});`,
      filename: "durable-objects/counter.ts",
    },
  ],
  invalid: [
    {
      code: `${head}defineDurableState({ version: 3, migrations: [{ version: 1, up }, { version: 3, up }] });`,
      filename: "durable-objects/counter.ts",
      errors: [{ messageId: "sequence" }],
    },
    {
      code: `${head}defineDurableState({ version: 1, migrations: [{ version: 2, up }] });`,
      filename: "durable-objects/counter.ts",
      errors: [{ messageId: "sequence" }],
    },
    {
      code: `${head}defineDurableState({ version: 3, migrations: [{ version: 1, migrate }, { version: 2, migrate }] });`,
      filename: "durable-objects/counter.ts",
      errors: [{ messageId: "version" }],
    },
  ],
});
