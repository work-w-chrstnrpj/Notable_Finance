import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "next-env.d.ts",
      "High-fidelity prototype for Notable Finance/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
