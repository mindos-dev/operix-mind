# Deployment

## Local

Use `docker compose up -d postgres redis api` or the root `npm run dev`.

## Production Docker

Use `docker-compose.prod.yml` with a populated `.env`.

## Database

Run:

```bash
npm run db:generate
npm run db:deploy
```

`db:deploy` maps to `prisma migrate deploy` in the API package. For local drift recovery, prefer `prisma db push` only when you intentionally need to sync a dev database.

## Health

- `/health`
- `/health/liveness`
- `/health/readiness`
- `/health/full`
