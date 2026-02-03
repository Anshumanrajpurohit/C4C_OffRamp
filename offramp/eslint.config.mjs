import { defineConfig } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";

const tsRecommendedRules = tsPlugin.configs?.recommended?.rules ?? {};
const nextRecommendedRules = nextPlugin.configs?.recommended?.rules ?? {};
const nextCoreWebVitalsRules = nextPlugin.configs?.["core-web-vitals"]?.rules ?? {};

export default defineConfig([
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 2023,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      ...tsRecommendedRules,
      ...nextRecommendedRules,
      ...nextCoreWebVitalsRules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@next/next/no-img-element": "off",
      "@next/next/google-font-display": "off",
      "@next/next/no-page-custom-font": "off",
    },
  },
]);
