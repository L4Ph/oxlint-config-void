import rule from "../../../src/plugin/rules/realtime/live-stream-options.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { defineLiveStream } from 'void/live';\n";

new RuleTester().run("live-stream-options", rule, {
  valid: [
    {
      code: `${head}export const live = defineLiveStream({ id: 'chat' });`,
      filename: "src/live.ts",
    },
    {
      code: `${head}export const feed = defineLiveStream({ id: 'feed', onSubscribe });`,
      filename: "src/live.ts",
    },
    {
      code: `${head}defineLiveStream({ id: 'a', limits: { maxSubscriptionsPerTopic: 256 } });`,
      filename: "src/live.ts",
    },
    { code: `${head}defineLiveStream({ id: 'a' });`, filename: "src/live.ts" },
    // not the Void function, and options built elsewhere
    { code: "defineLiveStream({});", filename: "src/live.ts" },
    { code: `${head}defineLiveStream(options);`, filename: "src/live.ts" },
    // guide/live.md:167
    {
      code: `${head}export const live = defineLiveStream({ id: 'app', limits: { maxSubscriptionsPerTopic: 64 } });`,
      filename: "src/live.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const live = defineLiveStream({});`,
      filename: "src/live.ts",
      errors: [{ messageId: "id" }],
    },
    {
      code: `${head}export const live = defineLiveStream();`,
      filename: "src/live.ts",
      errors: [{ messageId: "id" }],
    },
    {
      code: `${head}defineLiveStream({ id: 'a', limits: { maxSubscriptionsPerTopic: 1000 } });`,
      filename: "src/live.ts",
      errors: [{ messageId: "limit" }],
    },
    {
      code: `${head}defineLiveStream({ id: 'a', limits: { maxSubscriptionsPerTopic: 257 } });`,
      filename: "src/live.ts",
      errors: [{ messageId: "limit" }],
    },
  ],
});
