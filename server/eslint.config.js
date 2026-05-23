const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "off",
      indent: ["error", 2],
      quotes: ["error", "double"],
      semi: ["error", "always"],
    },
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
);
