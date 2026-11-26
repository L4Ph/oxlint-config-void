import { staticString, unwrap } from "../../lib/ast.ts";
import {
  arrayAt,
  at,
  configObject,
  isVoidConfig,
  keyName,
  literal,
  members,
  objectAt,
} from "../../lib/config.ts";
import { defineRule } from "../../rule.ts";

const APP_TYPES = ["void", "framework", "spa", "static"];
const BINDINGS = ["db", "kv", "storage", "ai", "email"];

/** The `inference` options (reference/config.md:564-630, guide/app-types.md:118). */
export default defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Give the inference options values of the documented shape: appType, outputDir, bindings and scanDirs.",
      norms: [
        "reference/config/56",
        "edge-integrations/frameworks-overview/10",
        "reference/config/58",
        "reference/config/59",
        "guide-core/app-types/10",
        "reference/config/60",
      ],
      scope: "void",
    },
    messages: {
      appType:
        "`inference.appType: '{{value}}'` is not an app type. Use 'void', 'framework', 'spa' or 'static', or omit it to detect it on first deploy. See reference/config.md.",
      outputDir:
        "`inference.outputDir` applies only to the 'spa' and 'static' app types, and this config sets '{{appType}}'. Remove `outputDir`, or change the app type. See reference/config.md.",
      bindingKey:
        "`inference.bindings.{{key}}` is not a binding Void infers. Use db, kv, storage, ai or email. See reference/config.md.",
      bindingValue: "`inference.bindings.{{key}}` must be {{expected}}. See reference/config.md.",
      scanDir:
        "`inference.scanDirs` entry '{{value}}' is not relative to the project root. Write it without a leading slash or drive letter (for example 'lib'). See reference/config.md.",
    },
    schema: [],
  },
  create(context) {
    if (!isVoidConfig(context.filename)) return {};
    return {
      Program(program) {
        const config = configObject(program);
        if (config === null) return;
        const appTypeProperty = at(config, "inference.appType");
        const appType = appTypeProperty === null ? null : staticString(appTypeProperty.value);
        if (appTypeProperty !== null && appType !== null && !APP_TYPES.includes(appType))
          context.report({
            node: appTypeProperty.value,
            messageId: "appType",
            data: { value: appType },
          });
        const outputDir = at(config, "inference.outputDir");
        if (
          outputDir !== null &&
          appType !== null &&
          APP_TYPES.includes(appType) &&
          appType !== "spa" &&
          appType !== "static"
        )
          context.report({ node: outputDir, messageId: "outputDir", data: { appType } });
        const bindings = objectAt(config, "inference.bindings");
        if (bindings !== null)
          for (const member of members(bindings).props) {
            const key = keyName(member) ?? "";
            if (!BINDINGS.includes(key)) {
              context.report({ node: member, messageId: "bindingKey", data: { key } });
              continue;
            }
            const value = unwrap(member.value);
            const known = literal(value);
            const bad =
              key === "email"
                ? known !== undefined
                  ? typeof known.value !== "boolean"
                  : value.type === "ObjectExpression" || value.type === "ArrayExpression"
                : known !== undefined
                  ? typeof known.value !== "boolean" && typeof known.value !== "string"
                  : value.type === "ObjectExpression" || value.type === "ArrayExpression";
            if (bad)
              context.report({
                node: member.value,
                messageId: "bindingValue",
                data: {
                  key,
                  expected:
                    key === "email"
                      ? "`true` or `false`"
                      : "`true`, `false` or a binding name string",
                },
              });
          }
        for (const element of arrayAt(config, "inference.scanDirs")?.elements ?? []) {
          if (element === null || element.type === "SpreadElement") continue;
          const value = staticString(element);
          if (value !== null && (value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)))
            context.report({ node: element, messageId: "scanDir", data: { value } });
        }
      },
    };
  },
});
