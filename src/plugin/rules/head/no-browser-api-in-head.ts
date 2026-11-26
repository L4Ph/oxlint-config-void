import { importBindings, namedExports, unwrap } from "../../lib/ast.ts";
import {
  type FunctionNode,
  importedCall,
  isFunction,
  isGlobalReference,
  references,
  within,
} from "../../lib/frameworks.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const BROWSER = new Set(["window", "document", "localStorage", "sessionStorage", "navigator"]);

/**
 * The head page: "`head()` runs server-side only, after the loader resolves." The rule
 * looks at the `head` export of a page's `.server` file, written as a function or as
 * `defineHead(fn)`, and at global references only: a local variable called `document` is
 * fine, and so is `typeof window`, the guard that does not touch the object.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not use window, document, localStorage, sessionStorage or navigator in head().",
      norms: ["pages-routing/head/2"],
      scope: "void",
    },
    messages: {
      browser:
        "`{{name}}` is a browser global, and `head()` runs on the server only. Read the value in the loader or from the request context `c` instead. See guide/pages-routing/head.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (!kind.serverCompanion || kind.private) return {};
    return {
      Program(program) {
        const head = namedExports(program).get("head");
        if (!head) return;
        let handler: FunctionNode | null =
          head.node.type === "FunctionDeclaration" ? head.node : null;
        if (head.init) {
          const init = unwrap(head.init);
          const call = importedCall(
            init,
            importBindings(program),
            "defineHead",
            (source) => source === "void" || source === "void/handler",
          );
          const argument = call?.arguments[0];
          const candidate = argument && argument.type !== "SpreadElement" ? unwrap(argument) : init;
          if (isFunction(candidate)) handler = candidate;
        }
        if (!handler) return;
        for (const reference of references(context)) {
          const identifier = reference.identifier;
          if (!BROWSER.has(identifier.name) || !isGlobalReference(reference)) continue;
          if (!within(identifier, handler)) continue;
          const parent = (identifier as unknown as { parent?: { type: string; operator?: string } })
            .parent;
          if (parent?.type === "UnaryExpression" && parent.operator === "typeof") continue;
          context.report({
            node: identifier,
            messageId: "browser",
            data: { name: identifier.name },
          });
        }
      },
    };
  },
});
