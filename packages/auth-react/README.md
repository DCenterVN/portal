# @dcentervn/auth-react

React context provider and headless hooks for authentication, session handling, and credential management.

## Usage

Wrap application with `AuthProvider`:

```tsx
import { AuthProvider } from "@dcentervn/auth-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
```

Use hooks in components:

```tsx
import { useLogin, useAuthSession } from "@dcentervn/auth-react";
```
