# Database Migration

## Generate client

```bash
npm run db:generate
```

## Deploy migrations

```bash
npm run db:deploy
```

## Local development

Use `npm run prisma:migrate -w @operix-mind/api` only when you want to create a new migration in development.

## Recovery

If a local dev database drifts too far from its migration history, reset only the local environment and reapply the schema.
