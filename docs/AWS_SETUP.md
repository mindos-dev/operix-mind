# AWS Setup

Configure these values only when you want cloud services:

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_S3_PUBLIC_BASE_URL`
- `AWS_SECRETS_MANAGER_PREFIX`
- `AWS_KMS_KEY_ID`
- `AWS_BEDROCK_MODEL_ID`
- `AWS_TEXTRACT_REGION`

Minimum permissions:

- S3 read/write/delete on the target bucket
- Secrets Manager read/write on the configured prefix
- KMS encrypt/decrypt if you use encrypted secrets
- Bedrock invoke permissions if premium AI is enabled
- Textract read permissions for OCR workloads
