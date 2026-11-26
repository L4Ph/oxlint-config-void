# oxlint-config-void

Oxlint rules and agent skills that hold a [Void](https://void.cloud/) app to the way
Void's documentation says to write one.

Everything here is derived from the docs of `void@1.11.0`, not from anyone's memory of
them:

|                                                                   | Count                     | Where                                                           |
| ----------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------- |
| Statements of the docs that tell an author or operator what to do | 1,699, from all 114 pages | `norms/`                                                        |
| Lint rules, each citing the statements it enforces                | 188                       | `src/plugin/rules/`, listed in [`docs/rules.md`](docs/rules.md) |
| Agent skills, for what a lint cannot check                        | 64                        | `skills/`                                                       |

Of the 563 statements a lint could check, rules enforce 468. The other 95 are waived, each
with its reason in `rules/plan.json`: the type checker already reports it (23), the check
would mostly report correct code or needs to know intent (21), it needs another file (14),
the docs do not actually require it (11), the docs contradict themselves (10), the docs'
own examples do it (10), a stock Oxlint rule covers it (3), or the quoted sentence does not
support the claim (3). The 1,136 statements a lint cannot check are carried by the skills;
`skills/<name>/norms.json` says where each one is.

## Use

This package is not on npm. Build it (`vp install && vp pack`) and extend the built
preset from a [Vite+](https://viteplus.dev/) project's `vite.config.ts`:

```ts
import voidConfig from "oxlint-config-void";
import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    extends: [voidConfig],
  },
});
```

`voidConfig` turns on, as errors, every rule that holds for a native Void app. Run
`vp lint`. Turn a rule off like any other: `rules: { "void/<name>": "off" }`.

An app that runs a meta-framework on Void extends that integration's preset instead. It
holds the rules of the integration and the ones true of every Void app, and leaves out the
native app's rules, because the framework owns routing and pages there:

```ts
import { frameworks } from "oxlint-config-void";

export default defineConfig({ lint: { extends: [frameworks.nuxt] } });
```

`frameworks` has `analog`, `astro`, `nuxt`, `react-router`, `sveltekit` and
`tanstack-start`.

Two settings, under `settings.void` in the lint config, for apps the rules cannot place by
themselves: `root` (the app's directory, relative to where the linter runs, when the app
has no `void.config.*` and is not at a `package.json`) and `sourceDir` (Void's own
`sourceDir` option).

The preset has been run through `vp lint` only. A standalone Oxlint config should accept
the same object, but that has not been tried.

## Skills

Each directory of `skills/` is one job an agent does on a Void project: changing the
database schema, deploying, adding auth, installing a self-hosted platform. `SKILL.md`
holds the steps; files beside it hold what only some uses need. 48 are for someone writing
an app, 14 for someone operating a self-hosted Void platform, 2 for both.

Commands that change remote or production state are marked `[REMOTE]`, and those that
remove access, sign people out or cannot be undone `[IRREVERSIBLE]`, each with what to
confirm first.

## How it is held to the docs

Tests fail when any of these stops being true:

- Every page of the installed Void docs is in the catalog, once.
- Every statement's quote is on the line of the docs it names. Upgrading Void and finding
  the test red is the signal to read the changed pages again.
- Every rule cites statements of the catalog, and exactly the ones the plan gave it.
- Every statement a lint could check is enforced by a rule or waived with a reason; every
  other statement is carried by a skill.
- No rule reports what an example in the docs writes. A test puts every code block of the
  docs that names its file into an app of its own and runs the preset over them with the
  real linter.

## What it does not do

- **No type information.** Oxlint gives a JavaScript plugin none, so a rule sees one file's
  syntax and path. Rules stay silent when they cannot tell: a value imported from another
  module is unknown, not wrong.
- **It does not settle what the docs leave open.** Where two pages disagree (whether a
  loader may return `c.json()`, where `compatibility_date` goes, which frameworks read
  `void/env`, the order of `voidPlugin()` for Analog, and others), no rule takes a side.
  The skills state both.
- **The summaries are a reader's.** In `norms/*.json`, `quote` is the docs' own words and
  `norm` is a one-line summary written while reading. Some summaries say more than their
  quote. Rules and skills were written from the quote and the page around it; where a
  summary and a quote differ, the quote is right.
- **Vue, Svelte and Astro templates.** Oxlint lints only the script blocks of those files,
  so a rule about markup covers `.tsx` and `.jsx`.

## Development

Use [Vite+](https://viteplus.dev/guide/) and Node.js 24. `vp install`, then `vp check` and
`vp test run`. `vp pack` builds `dist/`. `node scripts/rules-doc.ts > docs/rules.md`
regenerates the rule list. [`CONTRIBUTING.md`](CONTRIBUTING.md) says how a rule and a skill
are written from the docs.

## License

MIT. The quotes in `norms/` are from Void's documentation, which is distributed with the
`void` npm package under the MIT License, Copyright (c) 2026-present Cloudflare, Inc.
This project is not affiliated with Void or Cloudflare.
