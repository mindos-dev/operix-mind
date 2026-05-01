# Environment

## Required in production

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `SECRET_ENCRYPTION_KEY`

## Optional

- `AWS_*`
- `SMTP_*`
- `TELEGRAM_*`
- `SETUP_TOKEN`
- `REDIS_URL`

## Safety

Never commit secrets. The `.env.example` file documents the expected variables only.
