# Norms catalog

Every statement in Void's documentation that tells an application author what to do, what
not to do, or where something goes, with where it is enforced. One JSON file per area of
the docs. The lint rules and the skills in this repository are built from these files, and
a test checks that every `quote` is still in the docs of the installed Void version.

Docs read: `void@1.11.0`, the Markdown bundled in the npm package (`node_modules/void/docs`).

## File shape

```json
{
  "area": "pages-routing",
  "voidVersion": "1.11.0",
  "pages": [
    { "doc": "guide/pages-routing/loaders.md", "lines": 312, "norms": 14 }
  ],
  "norms": [
    {
      "id": "pages-routing/loaders/1",
      "doc": "guide/pages-routing/loaders.md",
      "line": 30,
      "quote": "Return data directly to preserve values such as `Date`, `Map`, `Set`",
      "norm": "Return plain data from a loader; do not wrap it in c.json() when the page needs Date, Map or Set values.",
      "appliesTo": "pages/**/*.server.{ts,tsx,js,jsx,mts,mjs}",
      "framework": "all",
      "enforcement": "lint",
      "detect": "In a .server file under pages/, the function passed to defineHandler for `loader` returns c.json(...).",
      "bad": "// pages/users.server.ts\nexport const loader = defineHandler((c) => c.json({ at: new Date() }));",
      "good": "// pages/users.server.ts\nexport const loader = defineHandler(() => ({ at: new Date() }));"
    }
  ]
}
```

- `pages`: every page of the area, including pages with no norm (`"norms": 0`).
- `id`: `<area>/<page name without extension>/<n>`, numbered in the order they appear.
- `quote`: copied verbatim from one line of the doc (a contiguous substring of that single
  line, at least 30 characters, enough to find it again). No ellipsis, no edits.
- `line`: the 1-based line number of that line in the file.
- `norm`: one imperative sentence, in English, that an application author can follow.
- `appliesTo`: the files or the situation it governs (a glob where one exists).
- `framework`: `all`, or one of `react`, `vue`, `svelte`, `solid` when the statement is
  about one adapter only.
- `enforcement`: exactly one of
  - `void-build`: the doc says Void itself rejects it (build error, thrown error, warning
    it prints). No lint rule is needed.
  - `lint`: a violation can be found from one file's syntax tree and its path alone
    (imports, exports, call shapes, file names, where the file sits).
  - `lint-types`: as `lint`, but it needs the TypeScript type of an expression.
  - `lint-partial`: a lint can catch the common form but not every form; say which.
  - `skill`: it takes judgement, knowledge of the product, or more than one file to tell.
- `detect`: for `lint*`, precisely what the rule looks for. For `skill`, why a lint cannot
  tell. For `void-build`, the words of the doc that say Void rejects it.
- `bad` / `good`: the smallest code (with a `// path` first line) that breaks and keeps the
  norm. For `skill`, a short description is enough.
