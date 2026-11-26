import { namedExports, unwrap } from "../../lib/ast.ts";
import { defaultValue, scanned } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";
import type { ESTree } from "vite-plus/lint/plugins";

/** A value that is certainly not a cron expression: a number, an object, a function, an array of those. */
function notCron(node: ESTree.Node): boolean {
  const value = unwrap(node);
  switch (value.type) {
    case "Literal":
      return typeof value.value !== "string";
    case "ObjectExpression":
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      return true;
    case "ArrayExpression":
      return value.elements.some(
        (element) => element?.type !== "SpreadElement" && element != null && notCron(element),
      );
    default:
      return false;
  }
}

/**
 * Each file in `crons/` exports the schedule as `cron` (a string, or an array of strings)
 * and a default handler. `defineScheduled` around the handler is recommended, not required.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export `cron` (a string or an array of strings) and a default handler from every file in crons/.",
      norms: [
        "reference/structure/15",
        "services/jobs/3",
        "services/jobs/4",
        "cli/generate/12",
        "services/jobs/2",
        "reference/structure/16",
      ],
      scope: "void",
    },
    messages: {
      missingCron:
        'This file is in `crons/`, so Void registers it as a job, but it does not export `cron`. Add `export const cron = "0 * * * *";` (or an array of expressions), or rename the file to start with `_` if it is a helper. See guide/jobs.md.',
      missingDefault:
        "This file is in `crons/`, so Void registers it as a job, but it has no default export. Add `export default defineScheduled(async (controller, env) => { ... })`, or rename the file to start with `_` if it is a helper. See guide/jobs.md.",
      notCron:
        'The exported `cron` must be a cron expression string, or an array of them: `export const cron = "0 * * * *";`. See guide/jobs.md.',
    },
    schema: [],
  },
  create(context) {
    if (!scanned(context, "crons")) return {};
    return {
      Program(program) {
        if (program.body.some((statement) => statement.type === "ExportAllDeclaration")) return;
        const cron = namedExports(program).get("cron");
        if (!cron) context.report({ node: program, messageId: "missingCron" });
        else if (cron.init && notCron(cron.init))
          context.report({ node: cron.init, messageId: "notCron" });
        if (!defaultValue(program)) context.report({ node: program, messageId: "missingDefault" });
      },
    };
  },
});
