# Platform email: the shared mail zone

Read this when the operator wants projects to send or receive email. Skip it otherwise.

[IRREVERSIBLE] Choose the shared sender domain and its Cloudflare zone ID once: Void saves them and the choice stands for the lifetime of the installation. Confirm both with the operator before anything is set.

1. The mail zone may differ from the application zone, but it must belong to the platform's Cloudflare account.
2. Configure Cloudflare Email Routing for the sender domain. For a subdomain, add it under **Email Routing > Settings > Subdomains**. Let Cloudflare add the MX and SPF records, then confirm the domain's MX records point to Cloudflare.
3. Add these to the runtime token. The zone permissions must cover every zone that carries mail, the mail zone included.

   | Scope   | Permission              | Access |
   | ------- | ----------------------- | ------ |
   | Account | Email Routing Addresses | Edit   |
   | Account | Email Sending           | Edit   |
   | Zone    | Zone                    | Read   |
   | Zone    | Zone Settings           | Edit   |
   | Zone    | Email Routing Rules     | Edit   |

   Email Sending onboarding for arbitrary recipients needs Workers Paid.

4. New install: set both `VOID_EMAIL_SENDER_DOMAIN` and `VOID_EMAIL_SHARED_ZONE_ID` before `void platform install`; the runtime-token link then preselects the permissions. Setting only one is an error.
5. Existing install: extend the runtime token (or supply `VOID_PLATFORM_RUNTIME_CLOUDFLARE_API_TOKEN`), then **[REMOTE]**:

   ```sh
   VOID_EMAIL_SENDER_DOMAIN=mail.example.com VOID_EMAIL_SHARED_ZONE_ID=<zone-id> void platform upgrade <installation-id>
   ```

   Preview it first with `--plan`.

6. If setup reports a missing permission, add every permission in the table (Edit access, Email Sending included) to the runtime token and rerun. A fresh install resumes with `void platform install --resume --name <installation-id>`.

The installer also creates an independent email signing key. Set `VOID_PLATFORM_EMAIL_SIGNING_SECRET` (at least 32 random bytes, separate from the other keys) when you need an externally held copy, for example a headless install whose local recovery files will not persist.

Done when the domain and zone ID are in the password manager, MX records point to Cloudflare, and the runtime token holds all five permissions.
