import rule from "../../../src/plugin/rules/platform/deploy-idempotency-key.ts";
import { RuleTester } from "../../rule-tester.ts";

new RuleTester().run("deploy-idempotency-key", rule, {
  valid: [
    {
      code: "await fetch(`${base}/projects/${id}/deploy`, { method: 'POST', headers: { 'x-void-deploy-idempotency-key': approvalId } });",
      filename: "scripts/publish.ts",
    },
    { code: "await fetch('/health');", filename: "scripts/publish.ts" },
    // another API's /deploy, and a request that is not a POST
    {
      code: "await fetch(`${base}/deploy`, { method: 'POST' });",
      filename: "scripts/publish.ts",
    },
    {
      code: "await fetch(`${base}/projects/${id}/deploy`);",
      filename: "scripts/publish.ts",
    },
    // headers built elsewhere are not looked into
    {
      code: "await fetch(`${base}/projects/${id}/deploy`, { method: 'POST', headers });",
      filename: "scripts/publish.ts",
    },
    // guide/platform/administration/connected-apps.md:79: the upload-urls request is not the deploy request
    {
      code: "await fetch(`${api}/projects/${id}/deploy/upload-urls`, { method: 'POST', headers: { authorization } });",
      filename: "scripts/publish.ts",
    },
    // guide/platform/administration/connected-apps.md:80
    {
      code: "await fetch(`${api}/projects/${id}/deploy`, { method: 'POST', headers: { 'x-void-deploy-idempotency-key': approvalId }, body });",
      filename: "scripts/publish.ts",
    },
  ],
  invalid: [
    {
      code: "await fetch(`${base}/projects/${id}/deploy`, { method: 'POST', headers: { authorization } });",
      filename: "scripts/publish.ts",
      errors: [{ messageId: "key" }],
    },
    {
      code: "await fetch(`${base}/projects/${id}/deploy`, { method: 'POST' });",
      filename: "scripts/publish.ts",
      errors: [{ messageId: "key" }],
    },
    {
      code: "await fetch(base + '/projects/' + id + '/deploy', { method: 'post', body });",
      filename: "scripts/publish.ts",
      errors: [{ messageId: "key" }],
    },
  ],
});
