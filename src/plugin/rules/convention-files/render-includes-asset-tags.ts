import { defaultExport, importBindings, namedExports, unwrap } from "../../lib/ast.ts";
import { callsImported, rootRelative, VOID_SOURCES, walk } from "../../lib/convention-files.ts";
import { defineRule } from "../../rule.ts";
import type { ESTree } from "vite-plus/lint/plugins";

const TAGS = ["css", "preloads", "body"];
const ENTRY = /^src\/main\.ssr\.(?:ts|tsx|js|jsx)$/;

/** The tags the second parameter's uses name, or null when it is used in a way that cannot be followed. */
function usedTags(fn: ESTree.Function | ESTree.ArrowFunctionExpression): Set<string> | null {
  const used = new Set<string>();
  const param = fn.params[1];
  if (!param) return used;
  if (param.type === "ObjectPattern") {
    for (const member of param.properties) {
      if (member.type !== "Property" || member.computed || member.key.type !== "Identifier")
        return null;
      if (!TAGS.includes(member.key.name)) return null;
      used.add(member.key.name);
    }
    return used;
  }
  if (param.type !== "Identifier" || !fn.body) return null;
  const name = param.name;
  let opaque = false;
  walk(fn.body, (node, parent) => {
    if (node.type !== "Identifier" || node.name !== name) return;
    if (parent?.type === "MemberExpression" && parent.object === node) {
      const key = parent.property;
      if (!parent.computed && key.type === "Identifier") used.add(key.name);
      else if (key.type === "Literal" && typeof key.value === "string") used.add(key.value);
      else opaque = true;
    } else if (parent?.type === "Property" && parent.key === node && !parent.computed) {
      // an object key that happens to share the name
    } else if (
      parent?.type === "MemberExpression" &&
      parent.property === node &&
      !parent.computed
    ) {
      // a property access `x.<name>`
    } else opaque = true;
  });
  return opaque ? null : used;
}

/**
 * The custom SSR entry puts Void's asset tags in the document it returns: the stylesheet
 * and preload tags in the head, the body tags before `</body>`. Only the renderer written
 * in the entry file is read; a renderer imported from another module is not followed.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Use assetTags.css and assetTags.preloads in the head and assetTags.body before </body> in a custom SSR renderer.",
      norms: ["guide-core/ssr/4"],
      scope: "void",
    },
    messages: {
      missing:
        "This renderer never uses these asset tags: {{missing}}, so the page ships without them. Put `${assetTags.css}${assetTags.preloads}` in `<head>` and `${assetTags.body}` before `</body>`. See guide/ssr.md.",
    },
    schema: [],
  },
  create(context) {
    const file = rootRelative(context);
    if (!file || !ENTRY.test(file.path)) return {};
    const bindings = importBindings(context.sourceCode.ast);
    return {
      Program(program) {
        const exported = defaultExport(program);
        let renderer: ESTree.Node | null = null;
        if (exported && callsImported(exported.value, "defineRender", VOID_SOURCES, bindings)) {
          const callback = (exported.value as ESTree.CallExpression).arguments[0];
          renderer = callback ? unwrap(callback) : null;
        } else if (!exported) {
          const render = namedExports(program).get("render");
          const node = render?.init ?? render?.node;
          renderer = node ? (node.type === "FunctionDeclaration" ? node : unwrap(node)) : null;
        }
        if (
          !renderer ||
          (renderer.type !== "ArrowFunctionExpression" &&
            renderer.type !== "FunctionExpression" &&
            renderer.type !== "FunctionDeclaration")
        )
          return;
        const used = usedTags(renderer);
        if (!used) return;
        const missing = TAGS.filter((tag) => !used.has(tag));
        if (missing.length > 0)
          context.report({
            node: renderer,
            messageId: "missing",
            data: { missing: missing.map((tag) => `assetTags.${tag}`).join(", ") },
          });
      },
    };
  },
});
