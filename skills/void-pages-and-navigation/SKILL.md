---
name: void-pages-and-navigation
description: "Builds Void pages-mode screens: page files and companions, render exports, layouts, head tags, links and navigation state. Use when adding or renaming a page, wiring a layout, setting titles or social tags, styling active links, or debugging prefetch and navigation."
---

# Void pages and navigation

Pages mode starts when a `pages/` directory exists. Pages serve UI; `routes/` serves APIs. Lint covers file naming, export literals and `Link` props (families `pages`, `head`, `placement`); this skill covers the choices lint cannot see.

## 1. Place the page and its companion

1. Put the component in `pages/` and keep one file per URL per environment: `about.tsx` or `about/index.tsx`, never both.
2. Pair server code in `<name>.server.ts`. It exports `loader`, `action`/`actions`, `head`, `ssr`, `prerender`.
3. A `.dev` or `.prod` page keeps its suffix in every companion: `home.dev.tsx` pairs with `home.dev.server.ts`; for islands the suffix precedes `.island` (`chart.dev.island.tsx`). Layouts are shared by both environments.
4. Run `void prepare` after adding or renaming a `.dev`/`.prod` page. Done when it exits 0 and the typecheck passes.

## 2. Set the render exports

- `export const ssr = false` makes the page a client-mounted shell; its loader still runs on the first request.
- An island page never exports `ssr = false`; islands already use their own renderer.
- Write `ssr` and `prerender` as the literals `true` or `false`, exported straight from the `.server` file. A computed value or a re-export is ignored with a warning, so the build log must show no such warning.

## 3. Wrap pages in layouts

1. Name the file `layout.<ext>` and place it in the `pages/` directory it should wrap. Layouts nest by directory and keep state across navigation.
2. Put named layouts in `pages/_layouts/` (`_layouts/landing.tsx`). A page picks one with `export const layout = 'landing'`.
3. `"landing"` replaces the innermost layout, `"!landing"` replaces the whole chain, `false` removes layouts.
4. Write `layout` as a string literal or `false`, exported directly from the page (computed values and re-exports are ignored with a warning). Name only layouts that exist in the page's directory or an ancestor `_layouts/`; a missing name fails the build.
5. Markdown and island pages: the docs disagree on the layout file name. See `void-island-and-markdown-pages`.

Done when the build prints no layout warning and the page renders inside the intended chain.

## 4. Set head tags

1. Put site-wide defaults (`titleTemplate`, `htmlAttrs`, charset and viewport meta) once under `head` in `void.config.ts`.
2. Put per-request defaults in middleware with `c.set('headDefaults', { ...c.get('headDefaults'), ... })`. Spread the existing value so earlier middleware keeps its entries.
3. Return page-specific tags from `head()` in the `.server` file. Page values win over middleware, middleware over config.
4. On a prerendered page give `og:image` and the other social URLs as absolute `https://` URLs. At request time Void makes relative paths absolute; the build does not know your origin and leaves them as written.

Done when the served HTML (`curl` the page) shows the expected `<title>` and absolute social URLs.

## 5. Link and navigate

- `router.visit()` takes same-origin URLs in place, gives other `http(s)` origins a full load, and rejects other schemes such as `javascript:`.
- Only same-origin GET links prefetch. Prefetch runs the destination's loader, so keep every loader free of side effects (view counters, writes).
- Mark a section link that has nested pages with `activeMatch="prefix"`.
- Style the exact page with `[aria-current="page"]` and its section with `[data-void-active]`. For a default filter tab that links to the bare path, set `aria-current` or `data-void-active` yourself; your value wins.
- Use `useNavigation()` for a whole-page loading indicator and `[data-void-pending]` for per-link feedback.

Read [navigation-details.md](navigation-details.md) when you style active or pending links, see Vue form state reset on navigation, await `router.visit()` in React transitions, or add view transitions.

Done when a click on each changed link updates the page without a document reload and the styled link matches the table in `navigation-details.md`.
