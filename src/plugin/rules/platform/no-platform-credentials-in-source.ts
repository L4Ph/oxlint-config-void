import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, staticString, unwrap } from "../../lib/ast.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const NAME = "(?:CLOUDFLARE_API_TOKEN|VOID_TOKEN|VOID_ACCESS_CREDENTIALS|VOID_PLATFORM_[A-Z0-9_]+)";
const CREDENTIAL = new RegExp(`^${NAME}$`);
const IN_COMMAND = new RegExp(`\\b${NAME}=(?!["']?(?:\\$|$|\\s))[^\\s]`);
const TOKEN_FLAG = /--token[ =](?!["']?(?:\$|$|\s))[^\s]{16,}/;
const RUNNERS = new Set([
  "exec",
  "execSync",
  "execFile",
  "execFileSync",
  "spawn",
  "spawnSync",
  "execa",
  "execaSync",
]);

/** A literal that is a value, not an empty string or a reference such as `${{ secrets.X }}` or `$X`. */
function isValue(text: string | null): text is string {
  return text !== null && text.trim() !== "" && !/^\$|\$\{/.test(text.trim());
}

/**
 * Narrower than the plan in two ways: test files are not read (they hold dummy values),
 * and a command string is reported only for the credentials the pages name, not for any
 * `KEY=` (`cli/deploy.md` gives `API_KEY=sk_live_…` as its example, which this misses).
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Keep platform and Cloudflare credentials out of source, workflows and build commands.",
      norms: ["platform/ci/2", "cli/deploy/17"],
      scope: "any",
    },
    messages: {
      literal:
        "`{{name}}` is written into source. Read it from the environment (`process.env.{{name}}`) and register the value as a CI secret, so the provider can mask it. See guide/platform/installation/ci.md.",
      command:
        "This command line carries a credential, which ends up in logs and shell history. Leave it out of the command and set it as a CI secret that the environment provides. See reference/cli/deploy.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (file && isTestFile(file.name)) return {};
    if (!file && /\.(test|spec)\.[cm]?[jt]sx?$/.test(context.filename)) return {};
    return {
      AssignmentExpression(node) {
        if (!["=", "??=", "||="].includes(node.operator) || node.left.type !== "MemberExpression")
          return;
        const left = node.left;
        const key = left.computed
          ? staticString(left.property)
          : left.property.type === "Identifier"
            ? left.property.name
            : null;
        if (key === null || !CREDENTIAL.test(key) || calleeName(left.object) !== "process.env")
          return;
        if (isValue(staticString(node.right)))
          context.report({ node: node.right, messageId: "literal", data: { name: key } });
      },
      Property(node: ESTree.ObjectProperty) {
        if (node.computed) return;
        const key =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal"
              ? String(node.key.value)
              : null;
        if (key !== null && CREDENTIAL.test(key) && isValue(staticString(node.value)))
          context.report({ node: node.value, messageId: "literal", data: { name: key } });
      },
      CallExpression(node) {
        const name = calleeName(node)?.split(".").pop();
        const first = node.arguments[0];
        if (!name || !RUNNERS.has(name) || !first || first.type === "SpreadElement") return;
        const value = unwrap(first);
        const command =
          value.type === "TemplateLiteral"
            ? value.quasis.map((q) => q.value.cooked ?? "").join("$")
            : staticString(value);
        if (command !== null && (IN_COMMAND.test(command) || TOKEN_FLAG.test(command)))
          context.report({ node: first, messageId: "command" });
      },
    };
  },
});
