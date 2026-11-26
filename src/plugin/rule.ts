import type { Rule } from "vite-plus/lint/plugins";

/** Which apps a rule holds for: a native Void app, one meta-framework integration, or both. */
export type Scope = "void" | "any" | `framework:${string}`;

/**
 * A rule of this plugin. `meta.docs.norms` names the entries of the norms catalog
 * (`norms/*.json`) the rule enforces: a rule exists only because Void's documentation
 * asks for what it checks, and a test holds every rule to that.
 */
export type VoidRule = Rule & {
  meta: {
    docs: {
      description: string;
      norms: string[];
      /** `framework:a,b` lists the integrations it belongs to. */
      scope: Scope;
    };
  };
};

/** Types a rule without importing the linter at run time: the plugin has no runtime dependency. */
export function defineRule(rule: VoidRule): VoidRule {
  return rule;
}
