# Preparing the artifact

Read this when writing the build step of a connected app.

## Build and prepare

Build in managed mode inside the app's isolated environment, then prepare in the same environment:

```sh
VOID_DEPLOY_BUILD=1 VOID_DEPLOY_PROJECT_ID=artifact npm run build
```

```ts
import { prepareDeployArtifact } from 'void/deploy';
const { artifact, assets } = await prepareDeployArtifact('/path/to/app');
```

The two variables select a platform-compatible build; the target project is chosen at publish approval. `artifact` holds the manifest, asset metadata and Worker modules; `assets` maps asset URL paths to base64 bytes.

- Keep the prepared result unchanged from preparation until publish approval completes; the approved digest covers those bytes.
- App configuration and build plugins execute project code. Run preparation inside the isolated build environment, and keep platform credentials on the publishing server only.
- `prepareDeployArtifact` serves built Cloudflare Worker apps, SPAs and static sites. For Node targets, Pages `output: 'static'`, remote data, deploy-time prerendering, Sandbox or Live resources, use `void deploy`.
- Rebuild artifacts built with an older Void version before preparing them with a newer toolchain.

Done when `prepareDeployArtifact` returns without throwing and the build environment held no platform credentials.

## Cloudflare Build Output (experimental)

`prepareCfBuildOutput(dir, { projectRoot, mode, accountId })` prepares an existing Worker build for Cloudflare publication; its options and output can change between Void releases. Pass a Worker output directory that contains a generated `wrangler.json` (`dist/ssr`, `dist/server`), or for native Cloudflare Build Output the project root containing `.cloudflare/output/v1`. It returns `null` for an unsupported configuration, a different `accountId`, or a different native build mode; missing or invalid build files throw. The result is a temporary copy: call `dispose()` after publication. For Containers built from a local Dockerfile, publish from the same Docker environment that built the image.
