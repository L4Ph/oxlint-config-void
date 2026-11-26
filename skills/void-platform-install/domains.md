# Domains, custom domains and the dashboard

Read this at step 1 or step 8 of the install when the application domain is nested or conflicts with other routes, when projects need their own domains, or when you add a dashboard origin or custom API hostname.

## Choose the application domain

- Pick a domain whose wildcard leaves existing Worker Custom Domains reachable (more-specific existing routes can preserve them). If Void reports a conflict, choose another domain; for a new install start with `--workers-dev` and add a suitable domain later.
- Apps on one application domain can set cookies that the other apps receive. With a nested domain such as `apps.example.com` apps can also set cookies for `example.com` and its other subdomains. On workers.dev, apps can set cookies every Worker on your `workers.dev` subdomain receives. If people outside the team can deploy, use a domain that serves only Void apps.
- Browser sessions are per origin. Apps with their own OAuth providers register their new callback URLs after a domain is added; Void's built-in auth follows the request origin.
- Void creates resources as `void-<name>-<role>` and stops on an unowned name conflict.

## Custom API hostname

`--control-plane-domain platform.example.net` at install. The hostname must belong to a zone the selected account and management token can manage. Omit it to keep the API on `workers.dev`.

## Nested application domain

An app at `my-app.apps.example.com` needs a certificate for `*.apps.example.com`; Universal SSL for `example.com` covers only first-level hostnames. Before install, have an active wildcard certificate: Advanced Certificate Manager (a paid add-on) or an existing custom one. Void does not order certificates or enable paid products.

```sh
void platform install --application-domain apps.example.com --zone example.com --plan
```

The management token needs **SSL and Certificates: Read** (or Edit) on that zone for the check. Leave `--dedicated-zone` off: it is only for installs whose application domain is the whole zone and adds catch-all routes. Done when the plan shows no certificate error.

## Project custom domains

Projects serve their own domains (for example `www.example.com`) through Cloudflare for SaaS custom hostnames. This needs a dedicated application zone. **[REMOTE]**:

```sh
void platform install --application-domain example.app --zone example.app --dedicated-zone --custom-domains
void platform upgrade <installation-id> --custom-domains
```

1. Give the runtime token **SSL and Certificates: Edit** on the application zone (Void checks it before deploying).
2. Once, before the first domain, on that zone: create a proxied DNS record for `cname.<application domain>` (for example an `AAAA` record pointing to `100::`), then in **SSL/TLS > Custom Hostnames** enable Cloudflare for SaaS and set `cname.<application domain>` as fallback origin.
3. A project owner runs `void domain add <hostname>`; Void prints the CNAME target and the TXT ownership records. When they resolve and the certificate is issued, the zone's catch-all routes send the hostname to the project.

Done when `void domain add` prints its records and the fallback origin is set.

## Dashboard origin

The API's `/admin/` pages are part of the core install. A separately deployed user dashboard is optional; Void only records its origin for login callbacks and creates no dashboard Worker and no DNS.

- `--dashboard-url https://dash.example.com` at install, or on an existing install preview and apply (**[REMOTE]**):

  ```sh
  void platform repair <installation-id> --dashboard-url https://dash.example.com --plan
  void platform repair <installation-id> --dashboard-url https://dash.example.com --yes
  ```

  `upgrade --dashboard-url` works the same way. Omit the flag to keep the saved origin.
- The origin is HTTPS with no credentials, path, query or fragment.
- Deploy the dashboard yourself from the source app's standalone dashboard instructions, with an unused Worker name, your hostname, and the installed API Worker as its `API` service binding. Set `API_URL` (public API origin), `DASHBOARD_URL` (dashboard origin) and `SITE_DOMAIN` (the application domain).
- If Access protects the platform, its application must cover the dashboard origin: configure the origin when installing protection. To change it on a protected platform, remove protection through the authentication configuration, apply the origin, then enable protection again; choose a separate admission rule first if signup depends on the Access gate. Maintenance stops while the origin is outside the active coverage.
