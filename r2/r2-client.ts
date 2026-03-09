/**
 * m8xtable — R2 client utility
 *
 * Uses the AWS S3-compatible API that Cloudflare R2 exposes.
 * Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 *
 * Usage:
 *   import { uploadFile, getPresignedUrl, deleteFile } from './r2/r2-client';
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

function createR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing R2 env vars. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) _client = createR2Client();
  return _client;
}

const BUCKET = process.env.R2_BUCKET_NAME ?? 'm8x-table-media-dev';

// ---------------------------------------------------------------------------
// Upload a local file to R2
// ---------------------------------------------------------------------------

export async function uploadFile(
  localPath: string,
  r2Key: string,
  contentType: string
): Promise<void> {
  const body = fs.readFileSync(localPath);

  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: body,
      ContentType: contentType,
    })
  );

  console.log(`Uploaded ${path.basename(localPath)} → r2://${BUCKET}/${r2Key}`);
}

// ---------------------------------------------------------------------------
// Upload a Buffer/Uint8Array directly
// ---------------------------------------------------------------------------

export async function uploadBuffer(
  buffer: Buffer | Uint8Array,
  r2Key: string,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  console.log(`Uploaded buffer → r2://${BUCKET}/${r2Key}`);
}

// ---------------------------------------------------------------------------
// Generate a presigned GET URL (for reading private objects)
// ---------------------------------------------------------------------------

export async function getPresignedGetUrl(
  r2Key: string,
  expiresInSeconds = 3600
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: BUCKET, Key: r2Key }),
    { expiresIn: expiresInSeconds }
  );
}

// ---------------------------------------------------------------------------
// Generate a presigned PUT URL (for direct browser/app uploads)
// ---------------------------------------------------------------------------

export async function getPresignedPutUrl(
  r2Key: string,
  contentType: string,
  expiresInSeconds = 900 // 15 minutes
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: BUCKET, Key: r2Key, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
}

// ---------------------------------------------------------------------------
// Delete an object from R2
// ---------------------------------------------------------------------------

export async function deleteFile(r2Key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: r2Key })
  );
  console.log(`Deleted r2://${BUCKET}/${r2Key}`);
}

// ---------------------------------------------------------------------------
// Check if an object exists
// ---------------------------------------------------------------------------

export async function fileExists(r2Key: string): Promise<boolean> {
  try {
    await getClient().send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key })
    );
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// R2 key helpers — follow the naming convention in setup.md
// ---------------------------------------------------------------------------

export const R2Keys = {
  recipeCover: (userId: string, uuid: string, ext: string) =>
    `${userId}/recipe-covers/${uuid}.${ext}`,

  stepImage: (userId: string, uuid: string, ext: string) =>
    `${userId}/step-images/${uuid}.${ext}`,

  recipeVideo: (userId: string, uuid: string, ext: string) =>
    `${userId}/recipe-videos/${uuid}.${ext}`,

  stepVideo: (userId: string, uuid: string, ext: string) =>
    `${userId}/step-videos/${uuid}.${ext}`,

  profilePicture: (userId: string, ext: string) =>
    `${userId}/profile/avatar.${ext}`,

  bookCover: (userId: string, uuid: string, ext: string) =>
    `${userId}/book-covers/${uuid}.${ext}`,

  bookEpub: (userId: string, title: string, collectionName: string, dateTime: string) =>
    `${userId}/books/${title}_${collectionName}_${dateTime}.epub`,
};
