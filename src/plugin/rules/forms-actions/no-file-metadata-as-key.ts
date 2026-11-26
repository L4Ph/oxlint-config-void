import type { ESTree } from "vite-plus/lint/plugins";
import { calleeName, importBindings, isCallOf } from "../../lib/ast.ts";
import {
  initOf,
  isFunction,
  memberName,
  strip,
  variableOf,
  walk,
} from "../../lib/forms-actions.ts";
import { describe, locate } from "../../lib/project.ts";
import { defineRule } from "../../rule.ts";

const GENERATED = /(?:^|\.)(?:randomUUID|nanoid|ulid|uuid|uuidv4|uuidv7)$/;
const REQUEST_VALUE = /^c\.req\.(?:param|query|header)$/;

function typeNameOf(annotation: unknown): string | null {
  const inner = (annotation as { typeAnnotation?: ESTree.Node } | null | undefined)?.typeAnnotation;
  return inner?.type === "TSTypeReference" && inner.typeName.type === "Identifier"
    ? inner.typeName.name
    : null;
}

/**
 * guide/pages-routing/actions-and-forms.md §File uploads: "file.name and file.type come
 * from the browser. Don't use them as the key"; guide/storage.md: store uploads "under
 * keys your server picks". Reported: a `storage.put` key built from `.name` / `.type` of
 * a binding the file shows to be a `File`, or from `c.req.param|query|header(...)`,
 * when the key has no generated id in it.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Store uploads under a key the server generates, not one taken from the request.",
      norms: ["pages-routing/actions-and-forms/28", "services/storage/4"],
      scope: "void",
    },
    messages: {
      key: "This storage key is built from {{source}}, which the browser chooses. Generate the key on the server, for example `uploads/${crypto.randomUUID()}.${ext}`. See guide/pages-routing/actions-and-forms.md (File uploads) and guide/storage.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file) return {};
    const kind = describe(file);
    if (kind.test || !(kind.serverCompanion || kind.convention === "routes")) return {};
    const bindings = importBindings(context.sourceCode.ast);
    if (![...bindings.values()].some((b) => b.source === "void/storage")) return {};

    /** A binding the file shows to be a `File`: `instanceof File`, a `File` annotation or cast. */
    function isFile(id: ESTree.Node): boolean {
      const variable = variableOf(context, id);
      if (!variable) return false;
      const def = variable.defs[0];
      if (def && typeNameOf((def.name as { typeAnnotation?: unknown }).typeAnnotation) === "File")
        return true;
      const init = initOf(context, id);
      if (
        init?.type === "TSAsExpression" &&
        typeNameOf({ typeAnnotation: init.typeAnnotation }) === "File"
      )
        return true;
      return variable.references.some((reference) => {
        const parent = reference.identifier.parent;
        return (
          parent.type === "BinaryExpression" &&
          parent.operator === "instanceof" &&
          parent.left === reference.identifier &&
          parent.right.type === "Identifier" &&
          parent.right.name === "File"
        );
      });
    }

    function isStorage(object: ESTree.Node): boolean {
      if (object.type !== "Identifier") return false;
      const binding = bindings.get(object.name);
      if (binding) return binding.source === "void/storage" && binding.imported === "storage";
      const init = initOf(context, object);
      return init !== null && isCallOf(strip(init), "createStorage", ["void/storage"], bindings);
    }

    return {
      CallExpression(node) {
        const callee = strip(node.callee);
        if (
          callee.type !== "MemberExpression" ||
          memberName(callee) !== "put" ||
          !isStorage(callee.object)
        )
          return;
        const key = node.arguments[0];
        if (!key) return;
        let source: string | null = null;
        let generated = false;
        walk(key, (n) => {
          if (isFunction(n)) return false;
          if (n.type === "CallExpression") {
            const name = calleeName(n);
            if (name !== null && GENERATED.test(name)) generated = true;
            if (name !== null && REQUEST_VALUE.test(name)) source ??= `\`${name}()\``;
          }
          const property = memberName(n);
          if (
            n.type === "MemberExpression" &&
            (property === "name" || property === "type") &&
            n.object.type === "Identifier" &&
            isFile(n.object)
          )
            source ??= `\`${n.object.name}.${property}\``;
        });
        if (source !== null && !generated)
          context.report({ node: key, messageId: "key", data: { source } });
      },
    };
  },
});
