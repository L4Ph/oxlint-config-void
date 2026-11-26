import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, unwrap } from "../../lib/ast.ts";
import { firstParamName, isJsx, walk } from "../../lib/pages.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

type Node = ESTree.Node;
type FunctionNode = ESTree.Function | ESTree.ArrowFunctionExpression;

const isFunction = (node: Node): node is FunctionNode =>
  node.type === "FunctionDeclaration" ||
  node.type === "FunctionExpression" ||
  node.type === "ArrowFunctionExpression";

/** True when the function returns JSX somewhere (a component, as opposed to a helper). */
function rendersJsx(fn: FunctionNode): boolean {
  let found = false;
  walk(fn.body, (node) => {
    if (found || (node !== fn.body && isFunction(node))) return false;
    if (node.type === "JSXElement" || node.type === "JSXFragment") found = true;
    return !found;
  });
  return found;
}

/**
 * "Read props inside JSX or memos instead of copying them in the component body"
 * (reference/api/pages.md:312). That is Solid's rule alone, so a file is read only when it
 * imports from `solid-js` or `@void/solid`.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "In a Solid page, read props inside JSX or memos; do not destructure or copy them in the component body.",
      norms: ["reference/pages/36"],
      scope: "void",
    },
    messages: {
      destructure:
        "Destructuring Solid props copies their values once, and the page stops updating when its props do. Take `props` and read `props.name` inside JSX, `createMemo` or `createEffect`. See reference/api/pages.md.",
      copy: "`const {{name}} = {{props}}.{{name}}` copies a Solid prop once, and it goes stale when the page's props update. Read `{{props}}.{{name}}` where you use it, or wrap it in `createMemo`. See reference/api/pages.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "pages" || !isJsx(file.name)) return {};
    const kind = describe(file);
    if (kind.test || kind.serverCompanion) return {};
    return {
      Program(program) {
        const bindings = importBindings(program);
        const solid = [...bindings.values()].some(
          (binding) =>
            binding.source === "solid-js" ||
            binding.source.startsWith("solid-js/") ||
            binding.source === "@void/solid",
        );
        if (!solid) return;
        for (const statement of program.body) {
          const declaration =
            statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
          const candidates: Node[] = [];
          if (statement.type === "ExportDefaultDeclaration")
            candidates.push(unwrap(statement.declaration as Node));
          else if (
            declaration?.type === "FunctionDeclaration" &&
            declaration.id &&
            /^[A-Z]/.test(declaration.id.name)
          )
            candidates.push(declaration);
          else if (declaration?.type === "VariableDeclaration")
            for (const declarator of declaration.declarations)
              if (
                declarator.id.type === "Identifier" &&
                /^[A-Z]/.test(declarator.id.name) &&
                declarator.init
              )
                candidates.push(unwrap(declarator.init));
          for (const node of candidates) {
            if (!isFunction(node) || !rendersJsx(node)) continue;
            const first = node.params[0];
            if (!first) continue;
            if (first.type === "ObjectPattern") {
              context.report({ node: first, messageId: "destructure" });
              continue;
            }
            const props = firstParamName(node);
            if (props === null || node.body?.type !== "BlockStatement") continue;
            for (const inner of node.body.body) {
              if (inner.type !== "VariableDeclaration") continue;
              for (const declarator of inner.declarations) {
                const init = declarator.init;
                if (
                  declarator.id.type === "Identifier" &&
                  init?.type === "MemberExpression" &&
                  !init.computed &&
                  init.object.type === "Identifier" &&
                  init.object.name === props &&
                  init.property.type === "Identifier"
                )
                  context.report({
                    node: declarator,
                    messageId: "copy",
                    data: { name: init.property.name, props },
                  });
              }
            }
          }
        }
      },
    };
  },
});
