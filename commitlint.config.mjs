/** @type {import('@commitlint/types').UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "test",
        "refactor",
        "chore",
        "docs",
        "ci",
        "build",
        "style",
        "perf",
        "revert",
      ],
    ],
  },
};

export default config;
