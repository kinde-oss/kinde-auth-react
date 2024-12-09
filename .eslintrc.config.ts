import react from "eslint-plugin-react";
import globals from "globals";

module.exports = [
  {
    env: {
      browser: true,
      es2021: true,
    },
    extends: [
      "eslint:recommended",
      "prettier",
      "plugin:react/recommended",
      "plugin:@typescript-eslint/recommended",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    rules: {},
  },
];
