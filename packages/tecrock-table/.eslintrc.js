// default configuration tuned for development
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import"],
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  settings: {
    react: {
      pragma: "React",
      version: "detect"
    }
  },
  ignorePatterns: [
    "build/", "node_modules/"
  ],
  extends: [
    "eslint:recommended",
    "plugin:eslint-comments/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "args": "none", "ignoreRestSiblings": true }],
    curly: ["error", "multi-line", "consistent"],
    eqeqeq: ["error", "smart"],
    "import/no-extraneous-dependencies": ["error"],
    "eslint-comments/no-unused-disable": "warn",
    "no-debugger": "off",
    "no-shadow": ["error", { "builtinGlobals": false, "hoist": "all", "allow": [] }],
    "no-unused-vars": "off",  // superceded by @typescript-eslint/no-unused-vars
    "react/prop-types": "off",
    semi: ["error", "always"]
  },
  overrides: [
    { // eslint configs
      files: [".eslintrc*.js"],
      env: {
        node: true
      }
    },
    { // webpack configs
      files: ["**/webpack.config.js"],
      env: {
        node: true
      },
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
        "quotes": ["error", "single", { allowTemplateLiterals: true, avoidEscape: true }],
      }
    }
  ]
};
