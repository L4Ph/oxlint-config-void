import rule from "../../../src/plugin/rules/testing/email-test-harness.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("email-test-harness", rule, {
  valid: [
    {
      code: "import { createEmailTestHarness } from 'void/email/testing';\nconst inbox = createEmailTestHarness();\nafterEach(() => inbox.dispose());",
      filename: "tests/a.test.ts",
    },
    {
      code: "import { createEmailTestHarness } from 'void/email/testing';\nit('sends', () => {});",
      filename: "tests/a.test.ts",
    },
    // A file the rule does not govern: not a test file.
    {
      code: "import { createEmailTestHarness } from 'void/email/testing';\nvi.mock('void/email');",
      filename: "src/helper.ts",
    },
    {
      // guide/email/sending.md line 234: the harness example.
      code: `import { describe, it, expect } from 'vite-plus/test';
import { sendEmail } from 'void/email';
import { createEmailTestHarness } from 'void/email/testing';

describe('signup flow', () => {
  it('sends a welcome email', async () => {
    const inbox = createEmailTestHarness();
    await sendEmail({ to: 'user@example.com', subject: 'Welcome', text: 'Hi!' });
    expect(inbox.messages).toHaveLength(1);
    inbox.dispose();
  });
});`,
      filename: "src/signup.test.ts",
    },
  ],
  invalid: [
    {
      code: "import { createEmailTestHarness } from 'void/email/testing';\nvi.mock('void/email');",
      filename: "tests/a.test.ts",
      errors: [{ messageId: "mock" }],
    },
    {
      code: "import { createEmailTestHarness } from 'void/email/testing';\nconst inbox = createEmailTestHarness();",
      filename: "tests/a.test.ts",
      errors: [{ messageId: "dispose" }],
    },
    {
      code: "import { createEmailTestHarness } from 'void/email/testing';\nvi.mock('void/email', () => ({ sendEmail: vi.fn() }));",
      filename: "src/a.spec.ts",
      errors: [{ messageId: "mock" }],
    },
  ],
});
