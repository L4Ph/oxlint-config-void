import { describe, isTestFile, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const NOT_SUPPORTED = ["middleware", "crons", "queues"];

/** The `.dev` / `.prod` suffix is read on `routes/` and `pages/` files only, and has a fixed place in the name. */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use the .dev/.prod suffix only on routes and pages, before .island/.ws, and never on layouts or in middleware/, crons/ or queues/.",
      norms: [
        "guide-core/server-routing/7",
        "pages-routing/overview/8",
        "services/websockets/6",
        "pages-routing/overview/10",
      ],
      scope: "void",
    },
    messages: {
      directory:
        "`{{name}}` carries a `.{{env}}` suffix, but suffixes apply only in `routes/` and `pages/`, not in `{{dir}}/`. Remove the suffix. See guide/server-routing.md.",
      order:
        "`{{name}}` puts `.{{env}}` after `.{{kind}}`. Write the environment suffix before it: `{{fixed}}`. See guide/pages-routing/overview.md.",
      layout:
        "`{{name}}` is a layout with a `.{{env}}` suffix, but layouts are shared across environments. Remove the suffix. See guide/pages-routing/overview.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || isTestFile(file.name)) return {};
    const kind = describe(file);
    const env = kind.environment;
    const data = { name: file.name, env: env ?? "", dir: file.dir };
    const after = /\.(island|ws)\.(dev|prod)(\.[^.]+)$/.exec(file.name);
    return {
      Program(program) {
        if (env && NOT_SUPPORTED.includes(file.dir) && !kind.private)
          context.report({ node: program, messageId: "directory", data });
        else if (after && (file.dir === "pages" || file.dir === "routes") && !kind.private)
          context.report({
            node: program,
            messageId: "order",
            data: {
              name: file.name,
              env: after[2] ?? "",
              kind: after[1] ?? "",
              fixed: file.name.replace(after[0], `.${after[2]}.${after[1]}${after[3]}`),
            },
          });
        else if (env && file.dir === "pages" && kind.layout)
          context.report({ node: program, messageId: "layout", data });
      },
    };
  },
});
