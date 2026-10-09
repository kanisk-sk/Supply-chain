import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      // Pages deliberately begin client-side requests in effects; a loading
      // update before an async response is part of that lifecycle.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "out/**", "next-env.d.ts"]),
]);
