# Custom sandbox images and sizes

Read this when `sandbox` in `void.config.ts` needs a custom `image`, `platformImage` or `instanceType`. Field list and defaults: `node_modules/void/docs/reference/config.md` section `sandbox`.

## Configure

```ts
export default defineConfig({
  sandbox: {
    image: "./Dockerfile.sandbox",
    platformImage: "registry.cloudflare.com/<account-id>/sandbox@sha256:<digest>",
    instanceType: "standard-1",
  },
});
```

Sizes: `lite` (default), `basic`, `standard-1` to `standard-4`.

## Include the Sandbox SDK helper

A custom image must copy the helper that matches Void's installed Sandbox SDK version. The SDK image only supplies the binary; it is not a runnable environment.

```dockerfile
FROM node:26.12.1-trixie-slim
COPY --from=docker.io/cloudflare/sandbox:1.0.2 /usr/local/bin/sandbox-shim /usr/local/bin/sandbox-shim
WORKDIR /workspace
CMD ["sleep", "infinity"]
```

Take the tag (`1.0.2` above) from the SDK version Void installs; the example is the docs' value for one release. Done when the image builds and `sandbox.run(['node', '--version'])` returns exit code 0 in `void dev` with it.

## Managed platform

Push the image to that platform account's Cloudflare registry (Cloudflare's image management guide) and set `platformImage` to the digest-pinned reference. External registries and mutable tags are not supported. An `image` that is already a Cloudflare registry reference also becomes the default `platformImage`. For a local Dockerfile you must supply `platformImage` when deploying to a managed platform.

## Deploy

`void deploy --platform cloudflare` builds native images and deploys the sandbox with the app. [REMOTE] REMOTE STATE (production Worker and container); run it only when the user asked. `void deploy` to a connected platform applies that platform's concurrency and runtime limits.
