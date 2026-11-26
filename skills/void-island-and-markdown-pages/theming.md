# Markdown theming

Read when importing the markdown stylesheet, overriding variables, or changing code block themes or the copy label.

## Pick a theme stylesheet

- Standalone markdown site: `@import '@void/md/theme.css';` (reset, body baseline, content styles).
- Markdown inside an app that has its own reset and global styles: `@import '@void/md/theme-content.css';` (only `.void-md`-scoped content styles).
- Wrap the content in an element with class `void-md` so the styles apply. To force light mode on a dark-preference system, set `data-theme="light"` on `<html>`.

## Override variables

Set `--vmd-*` variables on `.void-md`: `--vmd-font-body`, `--vmd-font-mono`, `--vmd-text`, `--vmd-text-muted`, `--vmd-link`, `--vmd-link-hover`, `--vmd-border`, `--vmd-bg-soft`, `--vmd-line-height`. Dark values apply through `prefers-color-scheme: dark` and `[data-theme="dark"]`.

## Code block themes and copy label

`voidMarkdown({ themes: { light: 'github-light', dark: 'github-dark' }, copyLabel: 'Copy Code' })`. An unknown theme name stops the build with an error; names such as `pierre-light` and `pierre-dark` are valid. The `shiki.themes` option is deprecated; use `themes`. On a translated site set `copyLabel` to the site's language (`'Copier le code'`).

Done when `vite build` succeeds and the copy button tooltip shows the chosen label.
