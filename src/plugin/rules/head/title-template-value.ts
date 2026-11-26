import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, namedExports, property, staticString, unwrap } from "../../lib/ast.ts";
import {
  configObject,
  importedCall,
  isConfigFile,
  isFunction,
  within,
} from "../../lib/frameworks.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

/**
 * The head page: "`%s` is replaced with whatever `head()` returns as `title`", and "to drop
 * the suffix entirely ... set the template to an empty string". A `titleTemplate` is read
 * in the three places the page names: the `head` export of a page's `.server` file, the
 * object a middleware passes to `c.set('headDefaults', ...)`, and the `head` of
 * `void.config.ts`. `undefined` is not reported: it may mean "no template here".
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give every non-empty titleTemplate a %s, and write an empty one as '' rather than null or false.",
      norms: ["pages-routing/head/4", "reference/config/16", "pages-routing/head/7"],
      scope: "void",
    },
    messages: {
      placeholder:
        "This `titleTemplate` has no `%s`, so the page title never appears in it. Write the title's place as `%s`, for example '%s | My Site'. See guide/pages-routing/head.md.",
      empty:
        "`titleTemplate` takes a string. To drop the title suffix, write the empty string '' instead. See guide/pages-routing/head.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    const config = isConfigFile(context, "void");
    const kind = file && describe(file);
    const page = kind?.serverCompanion && !kind.private;
    const middleware = kind?.convention === "middleware" && !kind.private;
    if (!page && !middleware && !config) return {};
    const scopes: ESTree.Node[] = [];
    return {
      Program(program) {
        if (config) {
          const head = configObject(program) && property(configObject(program)!, "head");
          if (head) scopes.push(head.value);
        }
        if (page) {
          const exported = namedExports(program).get("head");
          const init = exported?.init ? unwrap(exported.init) : null;
          if (exported && exported.node.type === "FunctionDeclaration") scopes.push(exported.node);
          else if (init) {
            const call = importedCall(
              init,
              importBindings(program),
              "defineHead",
              (s) => s === "void" || s === "void/handler",
            );
            const argument = call?.arguments[0];
            scopes.push(argument && isFunction(unwrap(argument)) ? argument : init);
          }
        }
      },
      CallExpression(node) {
        if (!middleware || node.callee.type !== "MemberExpression") return;
        const [name, value] = node.arguments;
        if (staticString(name ?? node) === "headDefaults" && value) scopes.push(value);
      },
      Property(node) {
        const key = node.key;
        const named =
          !node.computed &&
          ((key.type === "Identifier" && key.name === "titleTemplate") ||
            (key.type === "Literal" && key.value === "titleTemplate"));
        if (!named || !scopes.some((scope) => within(node, scope))) return;
        const value = unwrap(node.value as ESTree.Node);
        const text = staticString(value);
        if (text !== null && text !== "" && !text.includes("%s"))
          context.report({ node: value, messageId: "placeholder" });
        else if (value.type === "Literal" && (value.value === null || value.value === false))
          context.report({ node: value, messageId: "empty" });
      },
    };
  },
});
