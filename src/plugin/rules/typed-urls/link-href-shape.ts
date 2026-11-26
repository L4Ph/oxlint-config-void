import { importBindings, staticString } from "../../lib/ast.ts";
import { describe, locate } from "../../lib/project.ts";
import { destinationOf } from "../../lib/typed-urls.ts";
import { defineRule } from "../../rule.ts";

/**
 * guide/type-safety.md §Typed URLs and Navigation: "Use absolute paths within your app;
 * relative paths such as `../settings` are rejected", and build URLs with parameters with
 * `routeUrl()`. Reported: a relative path in a `Link` href or router call, and a path
 * built by `+` from a string that starts with `/`. A template literal is NOT reported:
 * guide/type-safety.md:293 writes `<Link href={`/users/${user.id}?tab=activity`}>` as a
 * checked URL string.
 */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give Link and router calls absolute paths, and build paths with parameters with routeUrl().",
      norms: [
        "guide-core/type-safety/15",
        "reference/pages/1",
        "guide-core/type-safety/6",
        "pages-routing/overview/16",
      ],
      scope: "void",
    },
    messages: {
      relative:
        "`{{url}}` is a relative path, which Void's typed URLs reject. Write an absolute path such as `/settings`. See guide/type-safety.md (Typed URLs and Navigation).",
      concat:
        "This URL joins a path parameter onto `{{start}}` with `+`. Build it with `routeUrl('/users/[id]', { params: { id } })`, which checks the pattern and encodes the value. See guide/type-safety.md (Typed URLs and Navigation).",
    },
    schema: [],
  },
  create(context) {
    const file = locate(context);
    if (!file || describe(file).test) return {};
    const bindings = importBindings(context.sourceCode.ast);

    function check(node: Parameters<typeof destinationOf>[1]) {
      const destination = destinationOf(context, node, bindings);
      if (!destination) return;
      const value = destination.value;
      const text = staticString(value);
      if (
        text !== null &&
        destination.kind !== "redirect" &&
        (text.startsWith("./") || text.startsWith("../"))
      ) {
        context.report({ node: value, messageId: "relative", data: { url: text } });
        return;
      }
      if (value.type !== "BinaryExpression" || value.operator !== "+") return;
      let left = value.left;
      while (left.type === "BinaryExpression" && left.operator === "+") left = left.left;
      const start = staticString(left);
      if (start !== null && start.startsWith("/") && !/[?#]/.test(start))
        context.report({ node: value, messageId: "concat", data: { start } });
    }

    return { JSXAttribute: check, CallExpression: check };
  },
});
