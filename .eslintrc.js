module.exports = {
  env: {
    node: true,
    commonjs: true,
    es6: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "no-console": "off",
    indent: ["off", "tab"],
    "linebreak-style": ["off", "unix"],
    quotes: ["error", "double"],
    semi: ["off", "never"],
  },
};
