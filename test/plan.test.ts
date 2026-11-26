import { readdirSync, readFileSync } from "node:fs";
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

describe("the plan", () => {
  type Norm = { id: string; enforcement: string };
  const waived: { norm: string }[] = JSON.parse(
    readFileSync(fileURLToPath(new URL("../rules/plan.json", import.meta.url)), "utf8"),
  ).waived;
  const normsDir = fileURLToPath(new URL("../norms", import.meta.url));
  const lintable = readdirSync(normsDir)
    .filter((name) => name.endsWith(".json"))
    .flatMap((name): Norm[] => JSON.parse(readFileSync(`${normsDir}/${name}`, "utf8")).norms)
    .filter((norm) => norm.enforcement.startsWith("lint"))
    .map((norm) => norm.id);

  it("is fully written: every planned rule is in the plugin", () => {
    expect(plan.rules.map((rule) => rule.name).filter((name) => !(name in rules))).toEqual([]);
  });

  it("leaves no norm a lint can check unaccounted for: a rule cites it, or it is waived with a reason", () => {
    const cited = new Set(Object.values(rules).flatMap((rule) => rule.meta.docs.norms));
    const set = new Set(waived.map((entry) => entry.norm));
    expect(lintable.filter((id) => !cited.has(id) && !set.has(id))).toEqual([]);
    expect(lintable.filter((id) => cited.has(id) && set.has(id))).toEqual([]);
  });
});

describe("docs/rules.md", () => {
  it("is the list the rules generate (node scripts/rules-doc.ts > docs/rules.md)", async () => {
    const { rulesDoc } = await import("../scripts/rules-doc.ts");
    expect(readFileSync(fileURLToPath(new URL("../docs/rules.md", import.meta.url)), "utf8")).toBe(
      rulesDoc(),
    );
  });
});
