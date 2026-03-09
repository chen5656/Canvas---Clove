/**
 * m8xtable — Upload test data to R2
 *
 * Run:
 *   npx ts-node r2/upload-test-data.ts
 *
 * Requires env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 * (R2_BUCKET_NAME defaults to 'm8x-table-media-dev')
 *
 * Place sample files in r2/test-assets/ before running:
 *   r2/test-assets/sample-cover.jpg
 *   r2/test-assets/sample-step.jpg
 *   r2/test-assets/sample-avatar.jpg
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { uploadFile, R2Keys } from './r2-client';

dotenv.config();

const TEST_USER_ID = 'test_user_001';
const ASSETS_DIR = path.join(__dirname, 'test-assets');

interface TestAsset {
  localFile: string;
  r2Key: string;
  contentType: string;
}

const TEST_ASSETS: TestAsset[] = [
  {
    localFile: path.join(ASSETS_DIR, 'sample-cover.jpg'),
    r2Key: R2Keys.recipeCover(TEST_USER_ID, 'test-recipe-001', 'jpg'),
    contentType: 'image/jpeg',
  },
  {
    localFile: path.join(ASSETS_DIR, 'sample-step.jpg'),
    r2Key: R2Keys.stepImage(TEST_USER_ID, 'test-step-001', 'jpg'),
    contentType: 'image/jpeg',
  },
  {
    localFile: path.join(ASSETS_DIR, 'sample-avatar.jpg'),
    r2Key: R2Keys.profilePicture(TEST_USER_ID, 'jpg'),
    contentType: 'image/jpeg',
  },
];

async function main() {
  console.log(`Uploading test data to bucket: ${process.env.R2_BUCKET_NAME ?? 'm8x-table-media-dev'}\n`);

  for (const asset of TEST_ASSETS) {
    if (!fs.existsSync(asset.localFile)) {
      console.warn(`  SKIP  ${asset.localFile} (file not found)`);
      continue;
    }

    try {
      await uploadFile(asset.localFile, asset.r2Key, asset.contentType);
      console.log(`  OK    ${asset.r2Key}`);
    } catch (err) {
      console.error(`  FAIL  ${asset.r2Key}:`, err);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
