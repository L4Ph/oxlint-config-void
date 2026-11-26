import rule from "../../../src/plugin/rules/database/db-bookmark-returned.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("db-bookmark-returned", rule, {
  valid: [
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nconst client = createDb(env.DB2, { session: { bookmark: b } });\nc.header('x-bookmark', getBookmark(client));",
      filename: "routes/a.ts",
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nconst c2 = createDb(env.DB2);",
      filename: "routes/a.ts",
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nconst c2 = createDb(env.DB, { session: 'first-primary' });",
      filename: "routes/a.ts",
    },
    {
      // guide/database/d1.md line 324: the createDb example.
      code: `import { users } from '@schema';
import { createDb, getBookmark } from 'void/db';

export async function readUsers(request, binding) {
  const incoming = request.headers.get('X-DB-Bookmark');
  const client = createDb(binding, {
    session: incoming === null ? 'first-unconstrained' : { bookmark: incoming },
  });
  const result = await client.select().from(users).all();
  const headers = new Headers({ 'Cache-Control': 'private, no-store' });
  const bookmark = getBookmark(client);
  if (bookmark) headers.set('X-DB-Bookmark', bookmark);
  return Response.json(result, { headers });
}`,
      filename: "lib/read.ts",
    },
  ],
  invalid: [
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nconst client = createDb(env.DB2, { session: { bookmark: b } });\nreturn c.json(await client.query.users.findMany());",
      filename: "routes/a.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nconst x = createDb(env.DB, { session: { bookmark } });",
      filename: "routes/a.ts",
      errors: [{ messageId: "missing" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nconst a = createDb(B1, { session: { bookmark: i } });\nconst b = createDb(B2, { session: { bookmark: i } });\nc.header('x', getBookmark(a));",
      filename: "routes/a.ts",
      errors: [{ messageId: "missing" }],
    },
  ],
});
