---
name: void-platform-email-recovery
description: Resolves interrupted email operations on a Void platform with `void platform email attempt-resolve`, `operation-resolve`, `shared-recipient-resolve` and `domain-remove`. Use when a send or a Cloudflare mutation (routing rule, Worker, secret, catch-all, Sending) timed out and blocks project or domain removal, or a domain cleanup is stuck on an expired token.
---

# Recover interrupted email operations

Void stops an email operation whose outcome is unknown and never replays it, because a replay can duplicate a provider write. An unresolved send attempt also blocks removal of its project or sender domain. A resolve command is the administrator's signed statement about what happened at the provider.

**[REMOTE]** marks a command that changes remote state; **[IRREVERSIBLE]** marks one that also removes access, signs people out, or cannot be undone. **Resolving wrongly can duplicate or lose provider writes, and nothing undoes the record.** Run a resolve command only when the operator asked for it in this session and has seen the preview. Platform selection, `--plan` and `--yes`: `void-platform-operator-cli`.

## 1. Find what is interrupted

| Kind | List | Resolve |
| --- | --- | --- |
| A send stopped after a provider call began | `void platform email attempts [--project <id\|slug>]` (ID, start time, earliest resolution time) | `attempt-resolve <attempt-id> --ended --reason <text>` |
| A Cloudflare routing, Worker, secret, catch-all or Sending mutation timed out | the operation ID in the blocked command's output or `system events` | `operation-resolve <operation-id> --ended --outcome <applied\|not-applied> --reason <text>` |
| A shared inbound recipient creation of unknown outcome (includes projects awaiting deletion) | `void platform email shared-recipients [--project <id\|slug>]` (rule names, IDs, intents) | `shared-recipient-resolve <recipient-id> --ended --outcome <applied\|not-applied> --reason <text>` |

Done when you have one ID and its kind.

## 2. Pass the gate (every kind)

All five must hold; stop and tell the operator which one fails.

1. **The original execution ended.** Confirm it through the Worker logs or incident records. `--ended` is your attestation that the call is no longer active. Never resolve while the original execution may still be running.
2. **Old enough.** The attempt, operation or creation intent is at least 24 hours old, and for a shared recipient the reported recovery time has passed. Elapsed time alone is never permission to retry: it only opens the gate.
3. **Same platform version** as the one that created the persisted intent. Before recovering an operation created by older code, restore the matching version (`void-platform-operator-cli`).
4. **Provider state inspected** (step 3), not guessed.
5. **Reason without personal data.** `--reason` is stored in the operator audit log (shared-recipient reasons also in platform events). Write the finding, with no recipient address and no message content: "Original Worker execution ended; provider outcome could not be verified".

## 3. Preview, inspect, resolve

1. Run the resolve command with `--plan`. The preview names the exact account, zone, recipient, rule, routing, Worker, secret, catch-all or Sending resource.
2. Inspect that exact resource at the provider. For a shared recipient use Cloudflare's provider audit. Absence alone proves nothing, including a missing rule.
3. Choose the outcome from the evidence:
   - `applied`: the exact owned rule or resource exists. The operation continues at the next step without replaying the write.
   - `not-applied`: the provider audit establishes that the write did not occur. The exact step retries from its persisted intent; a shared recipient intent is released after repeated provider inspection and your attestation.
   - `attempt-resolve` has no outcome flag: it records `outcome_unknown`, keeps the quota charge, never retries the send, and releases the project and domain cleanup fence (if the 30-day delivery record already expired, only the recipient-free fence is removed).
4. **[REMOTE] [IRREVERSIBLE]:** rerun the same command with `--yes` in place of `--plan`. If the intent or provider ownership changed since the preview, make a new plan first.
5. Verify. `void platform system events` shows the decision. Resolving creates or deletes no provider rule and never reopens a deleting project. After a shared-recipient resolve, delivery stays unready until normal reconciliation verifies it; retry a stopped project deletion afterwards. Secret rotation keeps its staged generation, and a removal resumes from its unresolved cleanup step.

Done when the blocked command (project or domain removal, `domain-sync`, rotation) runs past the point where it stopped, or status shows the next expected step.

## 4. Blocked domain cleanup after project deletion

**[IRREVERSIBLE]** the retained domain connection: `void platform email domain-remove <domain> [--token-stdin]` finishes cleanup and ends sending through the platform for that domain. It is for a project whose deletion already began, and only when no other project uses the connection.

1. Correct the permission that blocked cleanup, then run `void platform email domain-remove <domain>`.
2. If the saved Cloudflare token expired or was revoked, supply a replacement scoped to the same account and zone: `void platform email domain-remove <domain> --token-stdin --yes < token.txt` (remove `token.txt` afterwards).
3. For a project that still exists, renew its token through `void platform email domain-add <domain> --project <id|slug> --token-stdin` and leave `domain-remove` alone.

Done when `void platform email domains` no longer lists the domain.

A blocked setup or rotation that is not an unknown outcome resumes with `domain-sync <domain>` or `domain-rotate-secret <domain>` after the permission is fixed (`void-platform-email-admin`).
