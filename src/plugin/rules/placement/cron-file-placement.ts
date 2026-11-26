import { defaultExport, importBindings, namedExports } from "../../lib/ast.ts";
import { callsImported, JOB_EXTENSION, scanned, VOID_SOURCES } from "../../lib/convention-files.ts";
import { isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * A job is a file of `crons/`. A file elsewhere is reported only when it default-exports
 * `defineScheduled(...)`, the shape of a job file; a helper that builds handlers for
 * other files, or a file that exports a `cron` constant for another purpose, is not.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Put a file that defines a scheduled job in crons/, as a .ts, .mts, .js or .mjs file.",
      norms: ["services/jobs/1", "edge-integrations/frameworks-react-router/5"],
      scope: "any",
    },
    messages: {
      outside:
        "`{{path}}` default-exports a scheduled job, but Void registers jobs only from `crons/`. Move it to `crons/<name>.ts`. See guide/jobs.md.",
      extension:
        "`{{name}}` is a cron job with an extension Void does not read in `crons/`. Rename it to `.ts`, `.mts`, `.js` or `.mjs`. See guide/jobs.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const governed = scanned(context, "crons") !== null;
    if (file.dir === "crons" && !governed) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        const exported = defaultExport(program);
        const job =
          !!exported && callsImported(exported.value, "defineScheduled", VOID_SOURCES, bindings);
        if (file.dir !== "crons") {
          if (job && exported)
            context.report({
              node: exported.node,
              messageId: "outside",
              data: { path: file.path },
            });
        } else if ((job || namedExports(program).has("cron")) && !JOB_EXTENSION.test(file.name)) {
          context.report({ node: program, messageId: "extension", data: { name: file.name } });
        }
      },
    };
  },
});
