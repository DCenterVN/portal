import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  },
  {
    // FR-2: screens use only the in-house kit; app/ui-rules-gate.test.ts holds the class-level rules + baseline.
    files: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: [
              "@radix-ui/*", "@headlessui/*", "@mui/*", "@chakra-ui/*", "@mantine/*", "@nextui-org/*", "@heroui/*",
              "@ark-ui/*", "@base-ui-components/*", "@ariakit/*", "react-aria", "react-aria-components",
              "antd", "react-bootstrap", "react-select", "react-day-picker", "cmdk", "vaul", "sonner",
              "react-icons", "react-icons/*", "@heroicons/*", "@tabler/icons-react", "@phosphor-icons/*",
              "framer-motion", "motion", "motion/*",
            ],
            message: "Dùng @/components/ui|layout|patterns hoặc lucide-react (FR-2).",
          },
          { group: ["@/mocks", "@/mocks/*", "**/mocks/*"], message: "Mock chỉ được import trong test (FR-2)." },
        ],
      }],
      "no-restricted-syntax": ["error",
        { selector: "JSXText[value=/\\p{Emoji_Presentation}|\\p{Extended_Pictographic}\\uFE0F/u]", message: "Không dùng emoji trong JSX, dùng icon lucide (FR-2)." },
        { selector: "JSXOpeningElement[name.name='Button'] > JSXAttribute[name.name='className'] Literal[value=/(^|[\\s:])rounded-full(\\s|$)/]", message: "Cấm nút pill (FR-2)." },
      ],
    },
  },
  {
    // ponytail: nav/footer config still lives in mocks/ (layout-gate allows these two frames); move to features when real nav API lands.
    files: ["features/store/store-frame.tsx", "features/console/console-frame.tsx", "**/*.test.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    ignores: [".aidlc/**", ".next/**", "node_modules/**", "coverage/**", "next-env.d.ts"]
  }
];

export default config;
