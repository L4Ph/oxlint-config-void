# The Cloudflare Access company gate

The gate puts a company sign-in in front of the platform's API, proxy and configured dashboard origins. It is separate from login methods: a provider test shows an account but never touches the gate, and disabling an Access login method does not remove it. Protection for project hostnames is a different feature (`void-platform-zero-trust`).

## Preconditions

Only the installation owner, from the installing workstation that holds the saved recovery credentials, in a session of a signed-in administrator. Read the current state first: `void platform config auth protection show`.

## Change the gate

1. If company signup depends on the gate, first move signup to another verified company rule or restricted signup (`void platform config auth admission`, `SKILL.md` step 4). Removing the gate under company signup otherwise leaves signup without its rule.
2. Preview: `void platform config auth protection enable --installation <id> --plan` (or `disable`).
3. **[IRREVERSIBLE] Ends every human session** (administrators included) for both `enable` and `disable`: ask the operator to confirm the moment, and that they can sign in again. Then `--yes`.
   - `enable` offers to create Access applications or connect existing ones (`--file` takes the `cloudflareAccess` object of the installation setup docs). It checks every API, proxy and configured dashboard origin and requires a company user sign-in.
   - `disable` removes the protection but **leaves the Cloudflare applications behind** for deliberate cleanup. Tell the operator which applications remain; they delete them in Cloudflare themselves.
4. Sign in again with `void platform auth login`.

Done when `protection show` reports the new state and an administrator signs in again.
