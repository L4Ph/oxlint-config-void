# Contributing

Everything in this repository is derived from Void's documentation, in three steps, and a
test holds each step to the one before it.

1. `norms/*.json`: every statement of the docs that tells an author or operator what to do,
   with the doc's own words and line (`norms/SCHEMA.md`).
2. `rules/plan.json` and `skills/plan.json`: each norm assigned to one lint rule, to one
   skill, or waived with the reason.
3. `src/plugin/rules/` and `skills/`: the rules and the skills themselves.

Run `vp install` once, then `vp check` and `vp test run`. `vp pack` builds `dist/`.

## Writing a rule

A rule lives in `src/plugin/rules/<family>/<name>.ts`, is registered in that family's
`index.ts`, and is tested in `test/rules/<family>/<name>.test.ts`. Read
`src/plugin/rules/testing/no-test-in-route-dirs.ts` and its test first; they are the
pattern.

**Start from the docs, not from the plan's summary.** The plan entry (`rules/plan.json`,
by `name`) gives the norms the rule enforces. Open each norm in `norms/*.json`, read its
`quote`, then read the page around that line in `node_modules/void/docs`. The rule may
report only what those words support. Where the plan's `detect` asks for more than the
docs say, narrow the rule and say so in your report. Where a sound rule is not possible,
do not write one: report it, and the norm moves to `waived`.

**Shape.**

- Default-export `defineRule({ meta, create })` from `src/plugin/rule.ts`. The plugin has no
  runtime dependency: import types only (`import type { ESTree } from "vite-plus/lint/plugins"`).
- `meta.docs.description`: one sentence saying what must hold.
- `meta.docs.norms`: exactly the plan's `norms` for this rule. `meta.docs.scope`: the plan's `scope`.
- `meta.messages`: each message says what is wrong in this file and what to write instead,
  and names the docs page (`See guide/server-routing.md.`). Write it for someone who has
  not read the rule.
- `meta.schema`: `[]`, or the JSON schema of the options the plan lists.
- `create(context)` returns `{}` as early as it can for files the rule does not govern.

**Where a file sits.** `locate(context)` in `src/plugin/lib/project.ts` gives the file's
path inside its app; `describe(file)` says what it is to Void (convention directory,
`.server` companion, page component, island, layout, boundary, `.dev`/`.prod`, private).
A name that starts with `_` below a convention directory is skipped by Void, so most
rules skip it too (`describe(file).private`).

**Syntax helpers.** `src/plugin/lib/ast.ts`: `importBindings`, `isCallOf`, `calleeName`,
`unwrap`, `defaultExport`, `namedExports`, `topLevelConst`, `property`, `valueAt`,
`staticString`. Recognise an API by where it was imported from (`isCallOf(node,
"defineHandler", ["void", "void/handler"], bindings)`), never by its name alone. Helpers
only your family needs go in `src/plugin/lib/<family>.ts`. Leave `ast.ts`, `project.ts`,
`rule.ts` and other families' files as they are; if one of them needs a change, report it.

**One file at a time.** A rule sees a file's path, syntax tree and comments. Where the plan
calls a rule `typeAware`, check whether the linter gives a JS plugin type information
(`context.sourceCode.parserServices`); if it does not, implement what the syntax alone
supports and say what is lost. Oxlint lints only the script blocks of `.vue`, `.svelte`
and `.astro` files; a rule about template markup in those files covers `.tsx`/`.jsx` only.

**False reports are worse than misses.** When in doubt whether code is wrong, the rule
stays silent. Follow an identifier to a `const` of the same file; treat anything imported
or computed as unknown and do not report it.

**Tests.** Use `RuleTester` from `test/rule-tester.ts`. Every case has a `filename`.

- `valid`: at least three, including the plan's `allowed` samples, a file the rule does not
  govern, and **at least one example copied from the docs page the norms cite** (with a
  comment naming the page and line). A rule that reports the docs' own example is wrong.
- `invalid`: at least two, including the plan's `reported` samples, each asserting the
  `messageId`.

**Check your own files only**, because other families are being written at the same time:

```sh
vp test run test/rules/<family>
vp lint src/plugin/rules/<family> test/rules/<family>
vp fmt src/plugin/rules/<family> test/rules/<family>
```

## Writing a skill

A skill is `skills/<name>/SKILL.md`: what an agent needs to do a job on a Void project
that a lint cannot check, because it takes judgement, a sequence of commands, or more than
one file. The plan entry (`skills/plan.json`, by `name`) gives its description, its norms,
the commands and procedures it owns, and an outline.

**Start from the docs.** For each norm of the skill, read the `quote` and the page around
it in `node_modules/void/docs`. Write what the docs say. Where two pages disagree, say that
they do and give both; do not pick one.

**How it is written.**

- Front matter: `name` (the directory name) and `description`. The description is the only
  thing an agent sees before deciding to load the skill: say what the skill does, then the
  situations that should trigger it, one trigger per distinct situation, most telling word
  first. Third person. No more than about 60 words.
- The body is the steps of the job, in the order they are done. Each step ends on a
  condition the agent can check (`void db generate` printed no destructive statement; the
  response of `/health` is 200), not on a feeling of being done.
- Say what to do. A prohibition is for a hard guardrail only (a command that destroys
  data), and comes with what to do instead.
- Leave to the environment what a look answers: flag lists (`void <command> --help`),
  what a config file contains. Write what a look does not show: the order, the reason, the
  trap, what is irreversible, what Void refuses and how it says so.
- Keep `SKILL.md` to what every use of the skill needs, about 150 lines at most. Material
  only some uses reach (a provider-specific variant, a recovery path, a long reference
  table) goes in a sibling file `skills/<name>/<topic>.md`, reached by a line in `SKILL.md`
  that says when to read it.
- One meaning in one place. Do not restate what a lint rule already enforces; name the rule
  family in one line (`rules/plan.json` lists the rules by `family`).
- A command that changes remote or production state is marked **[REMOTE]** where it
  appears; one that also removes access, signs people out, or cannot be undone is marked
  **[IRREVERSIBLE]**. Each mark comes with what the command changes or destroys and what to
  confirm first (`norms/cli.json` `commands` records both for every command), and the step
  runs only when the person asked for that change.

**Nothing from the docs is dropped.** Write `skills/<name>/norms.json`: an object mapping
every norm id the plan gives the skill to where it is carried, as
`"<file>#<heading>"` (`"SKILL.md#Review the SQL"`), or to `"environment: <where an agent
finds it>"` for a fact you leave to a lookup. A test checks that every id is there and that
the file and heading exist.

**Language.** English. Short declarative sentences, active voice, the concrete mechanism or
number instead of an adjective.
