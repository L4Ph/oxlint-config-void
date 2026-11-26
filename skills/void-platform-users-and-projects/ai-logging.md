# AI Gateway logging per project

Read this when setting or checking `void platform project ai-logging`, or when a change reports an error. Only platform administrators change it; apps cannot override it. Project settings need platform 1.8.0 or later: when the CLI reports the platform does not support them, run `void platform upgrade` (**[REMOTE]**; only when the operator asked).

## Modes and precedence

| Mode       | Records                                                                      |
| ---------- | ---------------------------------------------------------------------------- |
| `inherit`  | follows the owner's plan default, then the gateway's own setting (default)   |
| `off`      | no log entry                                                                 |
| `metadata` | model, provider, status, token counts, cost, duration; no prompt or response |
| `full`     | log entry with prompt and response                                           |

A project uses the first that applies: its own `off`/`metadata`/`full`; the owner's plan default (a missing plan falls back to the signup default plan); the gateway's setting. Void does not read the gateway's setting, and a new installation enables gateway logging. `inherit` removes the project override.

It covers new Workers AI, Markdown conversion and provider requests through the platform, from deployed apps and from linked projects running `void dev`, including calls with the app's own provider key. It does not change requests already running, earlier logs, Logpush exports, Unified Billing records or gateway retention. AI usage limits apply in every mode.

## Check a change

`--plan` first, then `--yes`. The command prints the effective setting, its source and the expected time (normally within 2 minutes). Requests keep the previous behavior until it is published. `void platform project show <project-id>` shows the state:

| `state`                | Meaning and action                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `applied`              | published and propagated                                                                                            |
| `pending`              | published; wait until the expected time                                                                             |
| `pending_plan_publish` | plan default has not reached the project: `void platform config plans sync --yes`, or repeat the user's plan change |
| `drift`                | published differs from saved: repeat `project ai-logging`, or wait for the hourly repair                            |
| `unknown`              | Void could not read the published setting: check again shortly                                                      |

Done when `state` is `applied` and `effective` is the mode you set.

## Errors

| Error                           | Do                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| `ai_logging_publish_failed`     | not saved; read the previous setting in the message, retry                            |
| `ai_logging_publish_pending`    | saved, not active; retry to publish                                                   |
| `ai_logging_policy_unavailable` | an AI request returned HTTP 503, the setting could not be read; retry the request     |
| `ai_logging_policy_invalid`     | an AI request returned HTTP 503, the published setting is invalid; set the mode again |

The platform repairs unpublished settings hourly. To cancel a saved but pending change, set the previous value again; left pending, it takes effect later.
