import type { VoidRule } from "../../rule.ts";
import authNoStaticSchemaImport from "./auth-no-static-schema-import.ts";
import noXForwardedForInAuth from "./no-x-forwarded-for-in-auth.ts";
import preferRequireAuthRedirect from "./prefer-require-auth-redirect.ts";
import requireAuthThrowRedirectLiteral from "./require-auth-throw-redirect-literal.ts";

export const rules: Record<string, VoidRule> = {
  "auth-no-static-schema-import": authNoStaticSchemaImport,
  "no-x-forwarded-for-in-auth": noXForwardedForInAuth,
  "prefer-require-auth-redirect": preferRequireAuthRedirect,
  "require-auth-throw-redirect-literal": requireAuthThrowRedirectLiteral,
};
