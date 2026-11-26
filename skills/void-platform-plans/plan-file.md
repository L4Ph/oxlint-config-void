# Plan file fields

Read this when writing the JSON file for `plans add` or `plans set`. All fields are optional; omitted ones keep their current or copied values.

| Field               | Values                                                                                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`              | display name                                                                                                                                                                                |
| `limits`            | partial object of the limits below, each a nonnegative whole number                                                                                                                         |
| `buildInstanceType` | `standard-3` (2 vCPU, 8 GiB) or `standard-4` (4 vCPU, 12 GiB)                                                                                                                               |
| `allowShortSlugs`   | `true` permits future project slugs of five characters or fewer; `false` requires longer. Existing URLs are kept. Copies inherit it; built-in `free` disables it, other built-ins enable it |
| `aiLogging`         | `off`, `metadata`, `full`, or `inherit` (clears the plan's override)                                                                                                                        |

Limits: `requestsPerMonth`, `cpuMsPerRequest`, `maxCpuMsPerRequest`, `subRequestsPerInvocation`, `deploysPerDay`, `aiNeuronsPerMonth`, `retainedDeployments`, `sandboxRuntimeSecondsPerMonth`, `sandboxMaxConcurrentInstances`, `concurrentBuilds`, `buildTimeoutMinutes`.

Rules a preview will not tell you in advance:

- `0` means unlimited by the plan, except `buildTimeoutMinutes`: builds always have a platform maximum of 60 minutes and `0` selects that maximum.
- `cpuMsPerRequest` cannot exceed `maxCpuMsPerRequest`; an unlimited default requires an unlimited ceiling.
- Storage figures for D1, R2 and KV are informational and not editable as enforced quotas. Do not promise a storage cap through a plan. Static deployments keep their retention policy.
- Manual administrator suspensions stay in effect after a plan change.

Example: `{ "name": "Team", "limits": { "requestsPerMonth": 10000000, "concurrentBuilds": 3, "buildTimeoutMinutes": 15 }, "buildInstanceType": "standard-4" }`.
