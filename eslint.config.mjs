import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.mjs", "**/*.config.{js,mjs}"],
    languageOptions: {
      globals: globals.node
    }
  },
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
    // FR-2: screens use only components/ui (shadcn) and patterns; app/ui-rules-gate.test.ts holds the class-level rules + baseline.
    files: ["app/**/*.{ts,tsx}", "features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: [
              "@radix-ui/*", "radix-ui", "radix-ui/*", "@headlessui/*", "@mui/*", "@chakra-ui/*", "@mantine/*", "@nextui-org/*", "@heroui/*",
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
    // D1: Radix and sonner are reachable only through shadcn files in components/ui; every other component goes through them.
    files: ["components/**/*.{ts,tsx}"],
    ignores: ["components/ui/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@radix-ui/*", "radix-ui", "radix-ui/*", "sonner", "cmdk", "vaul"], message: "Import Radix/sonner chỉ trong components/ui (shadcn); chỗ khác dùng @/components/ui." }],
      }],
    },
  },
  {
    // ponytail: nav/footer config still lives in mocks/ (layout-gate allows these two frames); move to features when real nav API lands.
    files: ["features/store/store-frame.tsx", "features/console/console-frame.tsx", "**/*.test.{ts,tsx}"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts"]
  }
];

export default config;
