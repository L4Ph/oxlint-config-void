import type { VoidRule } from "../../rule.ts";
import useFrontmatterFromVoidMd from "./use-frontmatter-from-void-md.ts";
import voidMarkdownPluginSetup from "./void-markdown-plugin-setup.ts";

export const rules: Record<string, VoidRule> = {
  "use-frontmatter-from-void-md": useFrontmatterFromVoidMd,
  "void-markdown-plugin-setup": voidMarkdownPluginSetup,
};
