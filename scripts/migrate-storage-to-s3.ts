import { migrateLocalToS3 } from '../apps/api/src/modules/storage/storage.service.js';

async function main() {
  const result = await migrateLocalToS3();
  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
