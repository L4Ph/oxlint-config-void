import rule from "../../../src/plugin/rules/database/set-session-usage.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("set-session-usage", rule, {
  valid: [
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nsetSession('first-primary');",
      filename: "middleware/01.db.ts",
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nexport const GET = defineHandler(() => 1);",
      filename: "routes/a.ts",
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c, next) => { setSession('first-primary'); await next(); c.header('x-bookmark', getBookmark()); });",
      filename: "middleware/01.db.ts",
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c, next) => next());",
      filename: "middleware/01.db.ts",
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nsetSession('first-primary');",
      filename: "lib/session.ts",
    },
    {
      // guide/database/d1.md line 132: the cookie middleware, with its early `await next()` branch.
      code: `import { getCookie, setCookie } from 'hono/cookie';
import { defineMiddleware } from 'void';
import { getBookmark, setSession } from 'void/db';

export default defineMiddleware(async (c, next) => {
  const path = c.req.path;
  if (path !== '/profile' && !path.startsWith('/profile/')) {
    await next();
    return;
  }

  const incoming = getCookie(c, 'db-bookmark');
  setSession(incoming === undefined ? 'first-unconstrained' : { bookmark: incoming });
  await next();

  const bookmark = getBookmark();
  if (bookmark) {
    setCookie(c, 'db-bookmark', bookmark, { httpOnly: true, path: '/' });
  }
  c.header('Cache-Control', 'private, no-store');
});`,
      filename: "middleware/01.db.ts",
    },
  ],
  invalid: [
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nsetSession('first-primary');",
      filename: "routes/a.ts",
      errors: [{ messageId: "placement" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nsetSession('first-unconstrained');",
      filename: "pages/a.server.ts",
      errors: [{ messageId: "placement" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c, next) => { await db.query.users.findMany(); setSession('first-primary'); await next(); });",
      filename: "middleware/01.db.ts",
      errors: [{ messageId: "afterDb" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c, next) => { await next(); setSession('first-primary'); });",
      filename: "middleware/01.db.ts",
      errors: [{ messageId: "afterNext" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nexport default defineMiddleware(async (c, next) => { const b = getBookmark(); await next(); });",
      filename: "middleware/01.db.ts",
      errors: [{ messageId: "bookmarkBeforeNext" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nsetSession('first-secondary');",
      filename: "middleware/01.db.ts",
      errors: [{ messageId: "badName" }],
    },
    {
      code: "import { createDb, db, getBookmark, setSession } from 'void/db';\nimport { defineMiddleware } from 'void';\nsetSession(c.req.header('X-DB-Bookmark'));",
      filename: "middleware/01.db.ts",
      errors: [{ messageId: "unwrapped" }],
    },
  ],
});
