// Copyright (c) 2026 TokenJunction LLC
// SPDX-License-Identifier: Apache-2.0

import js from "@eslint/js";

export default [
  {
    ignores: ["coverage/**", "node_modules/**", "dist/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js", "test/**/*.js", "scripts/**/*.js", "eslint.config.js"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
    },
    rules: {
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
    },
  },
  {
    files: ["src/**/*.js"],
    rules: {
      "no-console": "error",
    },
  },
];
