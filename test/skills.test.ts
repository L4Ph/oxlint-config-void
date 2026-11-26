import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vite-plus/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const skillsDir = join(root, "skills");

type Planned = { name: string; norms: string[] };
const plan: { skills: Planned[]; waived: { norm: string }[] } = JSON.parse(
  readFileSync(join(skillsDir, "plan.json"), "utf8"),
);
type Norm = { id: string; enforcement: string };
const catalog = readdirSync(join(root, "norms"))
  .filter((name) => name.endsWith(".json"))
  .flatMap((name): Norm[] => JSON.parse(readFileSync(join(root, "norms", name), "utf8")).norms);

const headingsOf = (file: string) =>
  readFileSync(file, "utf8")
    .split("\n")
    .filter((line) => line.startsWith("#"))
    .map((line) => line.replace(/^#+\s*/, "").trim());

describe("the skills", () => {
  it("carry every norm a lint cannot hold: each is in one skill or waived", () => {
    const assigned = [
      ...plan.skills.flatMap((skill) => skill.norms),
      ...plan.waived.map((w) => w.norm),
    ];
    const owed = catalog
      .filter((norm) => norm.enforcement === "skill" || norm.enforcement === "void-build")
      .map((norm) => norm.id);
    expect(owed.filter((id) => !assigned.includes(id))).toEqual([]);
    expect(assigned.filter((id, index) => assigned.indexOf(id) !== index)).toEqual([]);
  });

  it("exist, one directory per planned skill and no other", () => {
    const directories = readdirSync(skillsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    expect(directories.toSorted()).toEqual(plan.skills.map((skill) => skill.name).toSorted());
  });

  it.each(plan.skills)(
    "$name: front matter names the directory and describes the skill",
    ({ name }) => {
      const text = readFileSync(join(skillsDir, name, "SKILL.md"), "utf8");
      const frontMatter = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? "";
      expect(
        /^name:\s*(.+)$/m
          .exec(frontMatter)?.[1]
          ?.trim()
          .replaceAll(/^["']|["']$/g, ""),
      ).toBe(name);
      expect(frontMatter).toMatch(/^description:\s*\S/m);
      // What every use needs stays in SKILL.md; the rest is disclosed in sibling files.
      expect(text.split("\n").length).toBeLessThanOrEqual(160);
    },
  );

  it.each(plan.skills)("$name: says where each of its norms is carried", ({ name, norms }) => {
    const where: Record<string, string> = JSON.parse(
      readFileSync(join(skillsDir, name, "norms.json"), "utf8"),
    );
    expect(Object.keys(where).toSorted()).toEqual(norms.toSorted());
    const dangling = Object.entries(where).filter(([, place]) => {
      if (place.startsWith("environment:")) return false;
      const [file = "", heading = ""] = place.split("#");
      const path = join(skillsDir, name, file);
      return !existsSync(path) || !headingsOf(path).includes(heading.trim());
    });
    expect(dangling).toEqual([]);
  });
});
