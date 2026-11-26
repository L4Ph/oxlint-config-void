import type { Rule } from "vite-plus/lint/plugins";

/**
 * A rule of this plugin. `meta.docs.norms` names the entries of the norms catalog
 * (`norms/*.json`) the rule enforces: a rule exists only because Void's documentation
 * asks for what it checks, and a test holds every rule to that.
 */
export type VoidRule = Rule & {
  meta: { docs: { description: string; norms: string[] } };
};

/** Types a rule without importing the linter at run time: the plugin has no runtime dependency. */
export function defineRule(rule: VoidRule): VoidRule {
  return rule;
}
