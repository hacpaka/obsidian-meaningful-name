import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
    {
        ignores: ["node_modules/**", "build/**", "main.js", "coverage/**"],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            sourceType: "module",
            globals: {
                ...globals.node,
            },
        },
        rules: {
            quotes: "off",
            // Kai's canons: every control-flow block in braces, K&R style.
            curly: ["error", "all"],
            "brace-style": ["error", "1tbs"],
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
            ],
            "no-console": ["error", { allow: ["error", "debug"] }],
        },
    }
);
