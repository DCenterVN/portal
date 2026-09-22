# @dcentervn/web

Customer and public-facing portal for Việt Sạch.

Runs on port `3000`.

## Features

- **Public Landing Page**: `/`
- **Authentication Flows**: `/login`, `/register`, `/activate`, `/forgot-password`, `/reset-password`, `/email-change`, `/email-confirm`
- **Reverse Proxy**: Proxies `/auth/*` and `/.well-known/*` to auth microservice (`:8080`).
