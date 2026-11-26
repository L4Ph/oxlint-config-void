import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import plugin from "../plugin/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const docsRoot = join(root, "node_modules/void/docs");
const normsDir = join(root, "norms");

const areas = readdirSync(normsDir)
  .filter((name) => name.endsWith(".json"))
  .map((name) => ({ name, ...JSON.parse(readFileSync(join(normsDir, name), "utf8")) }));
const norms = areas.flatMap((area) => area.norms);

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.name.endsWith(".md") ? [relative(docsRoot, path)] : [];
  });
}

const ENFORCEMENT = ["void-build", "lint", "lint-types", "lint-partial", "skill"];

describe("the norms catalog", () => {
  it("covers every page of the installed Void docs, each exactly once", () => {
    const listed = areas.flatMap((area) => area.pages.map((page) => page.doc)).sort();
    expect(listed).toEqual(markdownFiles(docsRoot).sort());
  });

  it("quotes the docs verbatim, at the line it says", () => {
    const wrong = norms.filter((norm) => {
      const line = readFileSync(join(docsRoot, norm.doc), "utf8").split("\n")[norm.line - 1];
      return line === undefined || !line.includes(norm.quote);
    });
    expect(wrong.map((norm) => norm.id)).toEqual([]);
  });

  it("gives every norm a unique id and a known enforcement", () => {
    const ids = norms.map((norm) => norm.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    expect(norms.filter((norm) => !ENFORCEMENT.includes(norm.enforcement)).map((n) => n.id)).toEqual(
      [],
    );
  });
});

describe("the rules", () => {
  const cited = new Map();
  for (const [name, rule] of Object.entries(plugin.rules))
    for (const id of rule.meta.docs.norms) cited.set(id, [...(cited.get(id) ?? []), name]);

  it("cite only norms that exist", () => {
    const known = new Set(norms.map((norm) => norm.id));
    expect([...cited.keys()].filter((id) => !known.has(id))).toEqual([]);
  });

  it("each cite at least one norm: a rule the docs do not ask for is not Void's", () => {
    expect(
      Object.entries(plugin.rules)
        .filter(([, rule]) => rule.meta.docs.norms.length === 0)
        .map(([name]) => name),
    ).toEqual([]);
  });
});
