# Database providers and Hyperdrive

Read this when you create the database with PlanetScale or Neon, size connections, or use a Hyperdrive you manage yourself.

## Provider connection settings

| Provider | Setting |
| --- | --- |
| PlanetScale Postgres | Choose **Postgres**, not Vitess/MySQL. In **Connect**, create role credentials and use the direct primary connection on port `5432`, not PgBouncer on `6432`, with `sslmode=verify-full`. The role password is shown once: save it and the **DATABASE URL** before closing the terminal. |
| Neon | In **Connect**, select the database and owner role and turn **connection pooling off**. Keep the connection unpooled, with TLS verification (`--ssl verify-full`). |

Done when the URL names the direct (unpooled) primary and carries its SSL settings.

## Provider CLI recipes

PlanetScale (`pscale`; creating the database and role is a billable **[REMOTE]** change, so confirm cluster size and price with the operator first):

```sh
pscale auth login
pscale org list
pscale region list --org <organization>
pscale size cluster list --org <organization> --engine postgresql --region <region>
pscale database create void-platform --org <organization> --engine postgresql --region <region> --cluster-size <cluster-size> --wait
pscale role create void-platform main void_owner --org <organization> --inherited-roles postgres
```

The last command prints the DATABASE URL and the role password.

Neon (`neon`; creating a project is a **[REMOTE]** change in the operator's Neon account):

```sh
neon login
neon projects create --name void-platform --database void_platform --role void_owner --region-id <region-id>
neon connection-string --project-id <project-id> --database-name void_platform --role-name void_owner --endpoint-type read_write --ssl verify-full
```

## Sizing and Hyperdrive limits

Count the connection pools of every platform installation and every application that shares the database server. Adjust each Hyperdrive's origin connection limit to fit the server, leaving room for migrations, administration, provider-reserved connections and bursts.

## Existing Hyperdrive

Use it when the database has a private CA or you manage Hyperdrive yourself. In the installer choose **Set up a separately managed Hyperdrive** (it prints instructions), then rerun the installer once the Hyperdrive exists. Void leaves its configuration to you.

1. Point it at the dedicated platform database with a runtime user, and disable SQL result caching.
2. Select it in the installer and check the database, runtime user, and the origin's host and port (or the Workers VPC service ID for a private database).
3. At the PostgreSQL URL prompt, supply a database owner connection so Void can apply migrations.

For unattended installs set `VOID_PLATFORM_HYPERDRIVE_ID`, `VOID_PLATFORM_HYPERDRIVE_ORIGIN_USER`, and either `VOID_PLATFORM_HYPERDRIVE_ORIGIN_HOST` or `VOID_PLATFORM_HYPERDRIVE_ORIGIN_SERVICE_ID` (never both), plus the owner URL in `VOID_PLATFORM_DATABASE_URL`. If a resume loses the selection, add `--hyperdrive <existing-id>`.

Done when SQL caching is off, the runtime user is set, and an owner URL is in the password manager.
