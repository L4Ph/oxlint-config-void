---
name: void-island-and-markdown-pages
description: "Builds Void island pages and markdown pages with @void/md: island import attributes, hydration strategies, frontmatter, page lists, themes. Use when adding a content or docs site, mixing interactive components into mostly static pages, naming layouts for markdown pages, or theming markdown output."
---

# Void island and markdown pages

Island pages render HTML on the server and hydrate only the components you mark. Markdown pages are `.md` files in `pages/` that ship JavaScript only for islands, client scripts and code-copy buttons. Lint covers import attribute shape and `Link` bans in islands (families `islands`, `markdown`); this skill covers when to use them and the traps.

## 1. Choose the page kind

- Mostly static content with a few interactive parts (blog, marketing, docs): island or markdown pages.
- Dashboards and apps with shared client state: regular pages (see `void-pages-and-navigation`).
- Navigating to or from an island page is a full page load. Inside island pages use plain `<a href>`; there is no Void Router to handle `Link`.

## 2. Build an island page

1. Name the file `<name>.island.<ext>` (`pages/blog/index.island.tsx`) with its `.server` companion. The companion uses the same `loader` and `action` pattern as regular pages.
2. Mark each interactive component at its import: `import Counter from './_Counter' with { island: 'load' }`. Strategies: `load`, `visible`, `idle`, `media:(max-width: 768px)`.
3. Components imported without the attribute render as static HTML only: no hooks, handlers or effects run in the browser.
4. Set `"module": "ESNext"` under `compilerOptions` in `tsconfig.json`; import attributes need it.
5. A page without a loader or dynamic params is prerendered automatically. Add `export const prerender = false` to the `.server` file when it must render per request.
6. Forms inside islands use `useIslandForm`. A successful submit reloads the page; redirects navigate.

Done when `vite build` succeeds and the browser loads JavaScript only for the marked components.

## 3. Build a markdown page

1. Install `@void/md` beside the adapter and add `voidMarkdown()` to `vite.config.ts` after the adapter plugin.
2. A page may open with a `<script>` block, then YAML frontmatter, then the body. Put island imports in the script block, with the framework's extension: `import Counter from "./Counter.vue" with { island: "visible" }`. Other code in that block runs in the browser on page load.
3. Place islands in the body with uppercase tags: `<Counter />`.
4. Put `title` and `description` in frontmatter; Void builds the head from them. Add a `.server.ts` only for dynamic data.
5. Choose a layout with `layout: post` in frontmatter (named layout in `pages/_layouts/`).
6. Frontmatter reaches the browser whenever a page has islands (islands can call `useFrontmatter()`). Keep secrets out of it.

Done when the page renders with its title and each island hydrates under its strategy.

## 4. Name the layout file (the docs conflict)

- `layouts.md` names layouts `layout.<ext>` (`pages/layout.tsx`).
- The file tree in `markdown.md` names them `layout.island.<ext>` (`pages/layout.island.tsx`, `pages/docs/layout.island.tsx`), and `islands.md` says island pages support layouts "the same way as regular pages". Layout components in island pages render on the server only and are not hydrated.

Neither page says the other is wrong, so settle it on the project: create the layout under one of the two names, run `vite dev`, and open a markdown page. If the layout does not wrap it, rename to the other name. Done when the layout wraps a markdown page and the name that worked is the only one left in `pages/`.

## 5. Build navigation from the page list

`import pages from '@void/md/pages'` lists every markdown page at build time: `{ path, title, frontmatter, headings }`, sorted by path, following `.dev`/`.prod` suffixes. Build sidebars, navigation and search indexes from it instead of listing pages by hand, for example `pages.filter(p => p.path.startsWith('/docs/'))`, and render `page.path` and `page.title`. Done when adding a `.md` file adds a sidebar entry with no other edit.

## 6. Theme

Read [theming.md](theming.md) when you import the stylesheet, override colors or fonts, or set code block themes and the copy label.
