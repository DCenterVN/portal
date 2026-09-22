import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "vitest.config.ts",
      "vitest.setup.ts",
      "lib/contracts/operations.generated.ts",
    ],
  },
];

export default eslintConfig;
