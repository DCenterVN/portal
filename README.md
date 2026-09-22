# DCenterVN Frontend Monorepo

Frontend workspace for the Việt Sạch supply chain platform.

## Architecture

```text
frontend/
├── apps/
│   ├── admin/          # Operations and platform management (:3001)
│   └── web/            # Customer storefront and public access (:3000)
└── packages/
    ├── design-tokens/  # Brand color palette, typography and layout variables
    ├── ui/             # Accessible UI primitives, layout shells, and auth views
    ├── auth-core/      # Framework-neutral validation, types, and logic
    ├── api-client/     # Typed HTTP client for Go backend endpoints
    └── auth-react/     # React Context and auth hooks
```

## Commands

```bash
# Local development
pnpm dev:web    # Customer portal on http://localhost:3000
pnpm dev:admin  # Admin operations portal on http://localhost:3001

# Monorepo verification
pnpm build      # Build both applications
pnpm test       # Run all 40 unit and component tests
pnpm typecheck  # Run TypeScript verification
pnpm lint       # Run ESLint across packages
```
