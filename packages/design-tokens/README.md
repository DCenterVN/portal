# @dcentervn/design-tokens

Authoritative design tokens, CSS variables, and design invariants for the Việt Sạch platform.

## Usage

In Next.js / CSS:

```css
@import "@dcentervn/design-tokens/tokens.css";
```

In TypeScript:

```typescript
import { BRAND_COLORS, BREAKPOINTS, Z_INDEX } from "@dcentervn/design-tokens";
```

## Governance Invariants

- **Sentence Case**: 100% sentence case.
- **Vietnamese Standard Formats**: `1.250.000 ₫`, `28/08/2026 · 14:30`, `250,0 kg`, `-18,5 °C`.
- **Prohibited Terms**: Do NOT use "resort"; use "chi nhánh", "branch", or "hub".
