# Mind_IA SSO and OAuth2

## Overview

Mind_IA supports a prepared OAuth2 surface for Google, GitHub and Microsoft Entra ID, plus local demo login flows for development.

## Runtime behavior

- Providers are listed from environment configuration.
- Admins can enable, disable and restore provider overrides.
- Overrides persist locally in `storage/oauth-provider-overrides.json`.
- Refresh tokens are stored in an `httpOnly` cookie with secure browser defaults.

## Diagnostics

- `GET /api/auth/oauth/summary`
- `GET /api/auth/oauth/export`
- `POST /api/auth/oauth/reset-all`

## Operational notes

- No client secret is exposed to the frontend.
- OAuth diagnostics export contains only provider state and timestamps.
- The local demo callback exists to validate the flow without external credentials.
