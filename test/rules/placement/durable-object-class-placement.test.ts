import rule from "../../../src/plugin/rules/placement/durable-object-class-placement.ts";
import { RuleTester } from "../../rule-tester.ts";

const HEAD =
  "import { DurableObject } from 'cloudflare:workers';\nimport { defineDurableObject } from 'void/durable';\n";

new RuleTester().run("durable-object-class-placement", rule, {
  valid: [
    {
      code: `${HEAD}export class Room extends DurableObject {}\nexport default defineDurableObject({ name: 'room', class: Room });`,
      filename: "durable-objects/room.ts",
    },
    { code: "export class Helper {}", filename: "lib/util.ts" },
    {
      code: "import { DurableObject } from 'cloudflare:workers';\nexport class Room extends DurableObject {}",
      filename: "lib/room.ts",
    },
    { code: "export class Local extends Base {}", filename: "durable-objects/local.ts" },
    // guide/durable-state.md line 176 (Native Durable Object classes)
    {
      code: `import { DurableObject } from 'cloudflare:workers';\nimport { defineDurableObject } from 'void/durable';\n\nclass WorkspaceObject extends DurableObject {\n  async fetch() {\n    return new Response('Workspace');\n  }\n}\n\nexport const Workspace = defineDurableObject({\n  name: 'workspace',\n  class: WorkspaceObject,\n});\nexport default Workspace;`,
      filename: "durable-objects/workspace.ts",
    },
  ],
  invalid: [
    {
      code: "import { DurableObject } from 'cloudflare:workers';\nexport class Room extends DurableObject {}",
      filename: "durable-objects/room.ts",
      errors: [{ messageId: "unwrapped" }],
    },
    {
      code: `${HEAD}export class Room extends DurableObject {}\nexport const Wrapped = defineDurableObject({ name: 'room', class: Room });`,
      filename: "durable-objects/room.ts",
      errors: [{ messageId: "notDefault" }],
    },
    {
      code: "import { Agent } from 'agents';\nexport class Bot extends Agent {}",
      filename: "durable-objects/bot.ts",
      errors: [{ messageId: "unwrapped" }],
    },
  ],
});
