import rule from "../../../src/plugin/rules/forms-actions/no-file-metadata-as-key.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = `import { storage } from 'void/storage';\n`;

new RuleTester().run("no-file-metadata-as-key", rule, {
  valid: [
    {
      code: `${head}await storage.put(\`uploads/\${crypto.randomUUID()}.png\`, file);`,
      filename: "pages/photos.server.ts",
    },
    { code: `${head}await storage.put(key, file);`, filename: "routes/upload.ts" },
    {
      // Not governed: a page component.
      code: `${head}const file = x as File;\nawait storage.put(\`uploads/\${file.name}\`, file);`,
      filename: "pages/photos.tsx",
    },
    {
      // guide/pages-routing/actions-and-forms.md:461-480 (File uploads)
      code: `import { defineHandler, ValidationError } from 'void/handler';
import { storage } from 'void/storage';

// file.name and file.type come from the browser. Don't use them as the key or trust the type.
const imageTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export const action = defineHandler(async (c) => {
  const body = await c.req.parseBody();
  const file = body['photo'];
  if (!(file instanceof File) || file.size === 0) return;
  const ext = imageTypes.get(file.type);
  if (!ext) {
    throw new ValidationError({ photo: 'Upload a JPEG, PNG, or WebP image.' });
  }
  await storage.put(\`uploads/\${crypto.randomUUID()}.\${ext}\`, file.stream(), {
    httpMetadata: { contentType: file.type },
  });
});`,
      filename: "pages/photos.server.ts",
    },
  ],
  invalid: [
    {
      code: `${head}export const action = async (c) => {\n  const file = (await c.req.parseBody())['photo'];\n  if (!(file instanceof File)) return;\n  await storage.put(\`uploads/\${file.name}\`, file);\n};`,
      filename: "pages/photos.server.ts",
      errors: [{ messageId: "key" }],
    },
    {
      code: `${head}export const POST = async (c) => { await storage.put(c.req.param('key'), await c.req.blob()); };`,
      filename: "routes/upload.ts",
      errors: [{ messageId: "key" }],
    },
    {
      code: `import { createStorage } from 'void/storage';\nexport const POST = async (c, f: File) => { const s = createStorage(c.env.MY_BUCKET); await s.put('a/' + f.type, f); };`,
      filename: "routes/upload.ts",
      errors: [{ messageId: "key" }],
    },
  ],
});
