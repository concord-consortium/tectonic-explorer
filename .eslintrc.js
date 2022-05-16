module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "json", "react", "react-hooks"],
  env: {
    browser: true,
    es6: true
  },
  settings: {
    react: {
      pragma: "React",
      version: "detect"
    }
  },
  ignorePatterns: [
    "dist/", "node_modules/"
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:eslint-comments/recommended",
    "plugin:json/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-confusing-non-null-assertion": "error",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-shadow": ["error", { builtinGlobals: false, hoist: "all", allow: [] }],
    "@typescript-eslint/no-unused-vars": ["warn", { args: "none", ignoreRestSiblings: true }],
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/no-var-requires": "off",
    "curly": ["error", "multi-line", "consistent"],
    "dot-notation": "error",
    "eol-last": "warn",
    "brace-style": "error",
    "eqeqeq": ["error", "smart"],
    "eslint-comments/no-unused-disable": "warn",
    "no-debugger": "off",
    "no-duplicate-imports": "error",
    "no-sequences": "error",
    "no-shadow": "off", // superceded by @typescript-eslint/no-shadow
    "no-tabs": "error",
    "no-unneeded-ternary": "error",
    "no-unused-expressions": ["error", { allowShortCircuit: true }],
    "no-unused-vars": "off",  // superceded by @typescript-eslint/no-unused-vars
    "no-useless-call": "error",
    "no-useless-concat": "error",
    "no-useless-rename": "error",
    "no-useless-return": "error",
    "no-var": "error",
    "no-whitespace-before-property": "error",
    "object-shorthand": "error",
    "prefer-const": "error",
    "prefer-object-spread": "error",
    "prefer-regex-literals": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "quotes": ["error", "double", { allowTemplateLiterals: true, avoidEscape: true }],
    "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: true }],
    "jsx-quotes": ["error", "prefer-double"],
    "indent": ["error", 2, { ignoredNodes: ["ConditionalExpression"] }],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],
    "radix": "error",
    "react/jsx-curly-spacing": ["error", { "when": "never", "children": { "when": "always" } }],
    "react/jsx-closing-tag-location": "error",
    "react/jsx-handler-names": "off",
    "react/jsx-no-useless-fragment": "error",
    "react/no-access-state-in-setstate": "error",
    "react/no-danger": "error",
    "react/no-unsafe": ["off", { checkAliases: true }],
    "react/no-unused-state": "error",
    "react/prop-types": "off",
    "semi": ["error", "always"],
    "space-before-function-paren": ["error", "never"]
  },
  overrides: [
    { // rules specific to Jest tests
      files: ["**/*.test.*"],
      env: {
        node: true,
        jest: true
      },
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "jest/no-done-callback": "off"
      }
    },
    { // rules specific to Cypress tests
      files: ["cypress/**"],
      env: {
        node: true,
        "cypress/globals": true
      },
      plugins: ["cypress"],
      extends: ["plugin:cypress/recommended"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "cypress/no-unnecessary-waiting": "off",
        "indent": "off",
        "quotes": "off"
      }
    },
    { // helper files
      files: ["**/setupTests.js", "**/webpack.config.js"],
      env: {
        node: true
      },
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ]
};
