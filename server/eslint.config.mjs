import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([

  {
    files: ["**/*.js", "**/*.cjs"],
    plugins: { js },
    extends: ["js/recommended"],

    languageOptions: {
      sourceType: "commonjs",

      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },


  {
    files: ["**/*.mjs"],
    plugins: { js },
    extends: ["js/recommended"],

    languageOptions: {
      sourceType: "module",

      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
]);
