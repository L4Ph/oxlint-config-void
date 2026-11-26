import rule from "../../../src/plugin/rules/resources/served-upload-nosniff.ts";
import { RuleTester } from "../../rule-tester.ts";

const head = "import { storage } from 'void/storage';\n";

new RuleTester().run("served-upload-nosniff", rule, {
  valid: [
    {
      code: `${head}const o = await storage.get(key);\nreturn new Response(o.body, { headers: { 'X-Content-Type-Options': 'nosniff' } });`,
      filename: "routes/a.ts",
    },
    { code: `${head}return c.json({});`, filename: "routes/a.ts" },
    // Not a route or a page companion; a private file.
    {
      code: `${head}const o = await storage.get(key);\nreturn new Response(o.body);`,
      filename: "src/serve.ts",
    },
    {
      code: `${head}const o = await storage.get(key);\nreturn new Response(o.body);`,
      filename: "routes/_serve.ts",
    },
    // guide/storage.md line 43: the docs' own example.
    {
      code: `import { defineHandler } from 'void';
import { storage } from 'void/storage';

export const GET = defineHandler(async (c) => {
  const object = await storage.get(\`uploads/\${c.req.param('key')}\`);

  if (!object) {
    return c.notFound();
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // Don't let an uploaded HTML or SVG file run as a page on your site.
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Disposition', 'attachment');

  return new Response(object.body, { headers });
});`,
      filename: "routes/files/[key].ts",
    },
  ],
  invalid: [
    {
      code: `${head}const o = await storage.get(key);\nreturn new Response(o.body);`,
      filename: "routes/a.ts",
      errors: [{ messageId: "nosniff" }],
    },
    {
      code: `${head}const o = await storage.get(key);\nreturn c.body(o.body);`,
      filename: "pages/files.server.ts",
      errors: [{ messageId: "nosniff" }],
    },
  ],
});
