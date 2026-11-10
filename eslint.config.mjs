import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layering (docs/07-conventions.md, "Kiến trúc nguồn"):
//   app → features → shared, server        (app = routing only)
//   features may use each other's types/lib/components, never app/
//   shared and server never import features or app
//   only src/shared/motion talks to the animation library
const banned = (patterns, message) => ({ group: patterns, message });
const MOTION_LIB = { regex: "^(motion|framer-motion)(/|$)", message: "Import animation from @/shared/motion (lazy features + reduced-motion live there)." };
const NO_APP = banned(["@/app", "@/app/*"], "app/ is routing only; move shared code into a feature or shared/.");
const NO_FEATURES = banned(["@/features/*"], "shared/ and server/ must not depend on features.");
const NO_SERVER = banned(["@/server/*"], "shared/ is usable from client components; server code lives in server/ or features/*/server.");

const restrict = (...groups) => ({ "no-restricted-imports": ["error", { patterns: groups }] });

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  { files: ["src/**/*.{ts,tsx}"], rules: restrict(MOTION_LIB, NO_APP) },
  { files: ["src/features/**/*.{ts,tsx}"], rules: restrict(MOTION_LIB, NO_APP) },
  { files: ["src/shared/**/*.{ts,tsx}"], ignores: ["src/shared/motion/**"], rules: restrict(MOTION_LIB, NO_APP, NO_FEATURES, NO_SERVER) },
  { files: ["src/shared/motion/**/*.{ts,tsx}"], rules: restrict(NO_APP, NO_FEATURES, NO_SERVER) },
  { files: ["src/server/**/*.{ts,tsx}"], rules: restrict(MOTION_LIB, NO_APP, NO_FEATURES) },
  { files: ["src/app/**/*.{ts,tsx}"], rules: restrict(MOTION_LIB) },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
