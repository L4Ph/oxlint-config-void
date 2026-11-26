import type { ESTree } from "vite-plus/lint/plugins";
import { importBindings, isCallOf, namedExports, property, unwrap } from "../../lib/ast.ts";
import { isPrivate, locate } from "../../lib/project.ts";
import { walk } from "../../lib/realtime.ts";
import { defineRule } from "../../rule.ts";

type Method = "connect" | "control";
const HANDLER_FOR: Record<Method, string> = { connect: "GET", control: "POST" };
const OTHER_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/** A module of the app (not a package): where a stream defined in another file is imported from. */
const APP_MODULE = /^(?:\.{1,2}\/|@\/|~\/|#)/;

/**
 * Narrower than the plan in what it takes for a stream: `<name>.connect(c)` counts only
 * when `<name>` is bound to `defineLiveStream(...)` in this file or imported from the
 * app's own modules, so another library's `connect` is left alone. A call outside the
 * expected handler is reported only inside another exported HTTP method; a helper that
 * is not exported is not followed.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Export `GET` calling `live.connect(c)` and `POST` calling `live.control(c)` from one route, with the same owner.",
      norms: ["services/live/7", "services/live/8", "services/live/15"],
      scope: "void",
    },
    messages: {
      wrongHandler:
        "`live.{{method}}(c)` belongs in the exported `{{expected}}` handler, and this one is in `{{found}}`. See guide/live.md.",
      missing:
        "This route calls `live.{{method}}(c)` and has no exported `{{other}}` calling `live.{{pair}}(c)`. A live stream needs both in the same route. See guide/live.md.",
      owner:
        "`connect` and `control` get different `owner` keys (`{{first}}` and `{{second}}`), so the browser cannot change its own subscriptions. Pass the same expression to both. See guide/live.md.",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || file.dir !== "routes" || isPrivate(file.segments)) return {};
    const program = context.sourceCode.ast;
    const bindings = importBindings(program);
    const streams = new Set<string>();
    for (const [name, binding] of bindings)
      if (APP_MODULE.test(binding.source) && !binding.typeOnly) streams.add(name);
    const exported = namedExports(program);
    return {
      Program(root) {
        for (const statement of root.body) {
          const declaration =
            statement.type === "ExportNamedDeclaration" ? statement.declaration : statement;
          if (declaration?.type !== "VariableDeclaration") continue;
          for (const declarator of declaration.declarations)
            if (
              declarator.id.type === "Identifier" &&
              declarator.init &&
              isCallOf(declarator.init, "defineLiveStream", ["void/live"], bindings)
            )
              streams.add(declarator.id.name);
        }
        const calls: { method: Method; node: ESTree.CallExpression; owner: string | null }[] = [];
        walk(root, (node) => {
          if (node.type !== "CallExpression" || node.callee.type !== "MemberExpression") return;
          const { object, property: name, computed } = node.callee;
          if (
            computed ||
            name.type !== "Identifier" ||
            object.type !== "Identifier" ||
            !streams.has(object.name)
          )
            return;
          if (name.name !== "connect" && name.name !== "control") return;
          if (node.arguments[0]?.type !== "Identifier") return;
          const options =
            node.arguments[1] && node.arguments[1].type !== "SpreadElement"
              ? unwrap(node.arguments[1])
              : null;
          const owner = options && property(options, "owner");
          calls.push({
            method: name.name,
            node,
            owner: owner ? context.sourceCode.getText(owner.value) : null,
          });
        });
        if (calls.length === 0) return;
        const inside = (call: ESTree.Node, handler: string) => {
          const found = exported.get(handler)?.node;
          const init = found?.type === "VariableDeclarator" ? found.init : found;
          return (
            !!init &&
            !!call.range &&
            !!init.range &&
            call.range[0] >= init.range[0] &&
            call.range[1] <= init.range[1]
          );
        };
        for (const call of calls) {
          const found = OTHER_METHODS.find((handler) => inside(call.node, handler));
          if (found && found !== HANDLER_FOR[call.method])
            context.report({
              node: call.node,
              messageId: "wrongHandler",
              data: { method: call.method, expected: HANDLER_FOR[call.method], found },
            });
        }
        for (const method of ["connect", "control"] as const) {
          const pair = method === "connect" ? "control" : "connect";
          const call = calls.find((c) => c.method === method);
          if (call && !calls.some((c) => c.method === pair))
            context.report({
              node: call.node,
              messageId: "missing",
              data: { method, other: HANDLER_FOR[pair], pair },
            });
        }
        const connect = calls.find((c) => c.method === "connect" && c.owner !== null);
        const control = calls.find((c) => c.method === "control" && c.owner !== null);
        if (connect && control && connect.owner !== control.owner)
          context.report({
            node: control.node,
            messageId: "owner",
            data: { first: connect.owner ?? "", second: control.owner ?? "" },
          });
      },
    };
  },
});
