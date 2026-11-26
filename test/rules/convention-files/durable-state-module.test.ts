import rule from "../../../src/plugin/rules/convention-files/durable-state-module.ts";
import { RuleTester } from "../../rule-tester.ts";

const IMPORT = "import { defineDurableState } from 'void/durable';\n";

new RuleTester().run("durable-state-module", rule, {
  valid: [
    {
      code: `${IMPORT}export default defineDurableState({ name: 'cart' });`,
      filename: "durable-objects/cart.ts",
    },
    { code: "export const x = 1;", filename: "lib/x.ts" },
    {
      code: `${IMPORT}const cart = defineDurableState({});\nexport default cart;\nexport { cart };`,
      filename: "durable-objects/cart.ts",
    },
    { code: "export const x = 1;", filename: "durable-objects/_helpers.ts" },
    // the named export is not required: it depends on other modules calling over RPC
    {
      code: `${IMPORT}const cart = defineDurableState({ name: 'cart' });\nexport default cart;`,
      filename: "durable-objects/cart.ts",
    },
    // guide/durable-state.md line 15 (Define state and methods)
    {
      code: `import { defineDurableState } from 'void/durable';\n\nexport const Counter = defineDurableState({\n  initialState: { count: 0 },\n  methods: {\n    increment(context, amount: number) {\n      context.state.count += amount;\n      return context.state.count;\n    },\n  },\n});\n\nexport default Counter;`,
      filename: "durable-objects/counter.ts",
    },
    // guide/durable-state.md line 176 (Native Durable Object classes)
    {
      code: `import { DurableObject } from 'cloudflare:workers';\nimport { defineDurableObject } from 'void/durable';\n\nclass WorkspaceObject extends DurableObject {}\n\nexport const Workspace = defineDurableObject({\n  name: 'workspace',\n  class: WorkspaceObject,\n});\nexport default Workspace;`,
      filename: "durable-objects/workspace.ts",
    },
  ],
  invalid: [
    {
      code: `${IMPORT}export default defineDurableState({ name: 'cart' });`,
      filename: "lib/cart.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}const c = defineDurableState({});`,
      filename: "routes/cart.ts",
      errors: [{ messageId: "location" }],
    },
    {
      code: `${IMPORT}export const cart = defineDurableState({ name: 'cart' });`,
      filename: "durable-objects/cart.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "export default {};",
      filename: "durable-objects/cart.ts",
      errors: [{ messageId: "plain" }],
    },
  ],
});
