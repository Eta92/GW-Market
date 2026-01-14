import { defineConfig, globalIgnores } from "eslint/config";
import unusedImports from "eslint-plugin-unused-imports";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["projects/**/*"]), {
    files: ["**/*.ts"],

    extends: compat.extends(
        "plugin:@typescript-eslint/recommended",
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
    ),

    plugins: {
        "unused-imports": unusedImports,
    },

    languageOptions: {
        ecmaVersion: 5,
        sourceType: "script",

        parserOptions: {
            project: ["tsconfig.json"],
            createDefaultProgram: true,
        },
    },

    rules: {
        "@angular-eslint/component-selector": ["error", {
            prefix: "app",
            style: "kebab-case",
            type: "element",
        }],

        "@angular-eslint/directive-selector": ["error", {
            prefix: "app",
            style: "camelCase",
            type: "attribute",
        }],

        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/explicit-function-return-type": "error",
        eqeqeq: "error",
        "unused-imports/no-unused-imports": "error",

        "sort-imports": ["error", {
            ignoreDeclarationSort: true,
            allowSeparatedGroups: true,
        }],
    },
}, {
    files: ["**/*.html"],
    extends: compat.extends("plugin:@angular-eslint/template/recommended"),
    rules: {},
}]);