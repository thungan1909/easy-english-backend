import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,cjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: {
        ...globals.node, // ✅ Node.js globals
      },
    },
    rules: {
      // Backend-friendly rules
      "no-console": "off",
      "no-underscore-dangle": "off",
      "consistent-return": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "req|res|next" }],
    },
  },
]);
