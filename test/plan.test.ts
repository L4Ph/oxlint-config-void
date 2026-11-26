import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { rules } from "../src/plugin/index.ts";

type Planned = { name: string; norms: string[]; scope: string };
const plan: { rules: Planned[] } = JSON.parse(
  readFileSync(fileURLToPath(new URL("../rules/plan.json", import.meta.url)), "utf8"),
);
const planned = new Map(plan.rules.map((rule) => [rule.name, rule]));
const sorted = (ids: string[]) => ids.toSorted((a, b) => a.localeCompare(b));

describe("every rule in the plugin", () => {
  it("is one the plan designed from the docs", () => {
    expect(Object.keys(rules).filter((name) => !planned.has(name))).toEqual([]);
  });

  it("cites exactly the norms the plan gave it, and has the plan's scope", () => {
    const different = Object.entries(rules).filter(([name, rule]) => {
      const design = planned.get(name);
      return (
        design !== undefined &&
        (sorted(rule.meta.docs.norms).join() !== sorted(design.norms).join() ||
          rule.meta.docs.scope !== design.scope)
      );
    });
    expect(different.map(([name]) => name)).toEqual([]);
  });
});
