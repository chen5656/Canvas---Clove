# m8xtable — R2 Object Storage Setup

Media files (cover images, step images, recipe videos, step videos, profile pictures, book covers, EPUB files) are stored in Cloudflare R2.

---

## 1. Create the R2 bucket

```bash
npx wrangler r2 bucket create m8x-table-media
```

Create a separate bucket for development:

```bash
npx wrangler r2 bucket create m8x-table-media-dev
```

---

## 2. Configure CORS (required for direct browser/app uploads via presigned URLs)

Create `r2/cors.json`:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

Apply:

```bash
npx wrangler r2 bucket cors put m8x-table-media --rules r2/cors.json
npx wrangler r2 bucket cors put m8x-table-media-dev --rules r2/cors.json
```

---

## 3. Generate R2 API credentials

1. Go to [Cloudflare Dashboard → R2 → Manage R2 API Tokens](https://dash.cloudflare.com/?to=/:account/r2/api-tokens)
2. Create a token with **Object Read & Write** permissions scoped to `m8x-table-media`
3. Copy the **Access Key ID** and **Secret Access Key**

---

## 4. Environment variables

Add to your `.env` (never commit this file):

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=m8x-table-media
R2_PUBLIC_URL=https://pub-<hash>.r2.dev   # optional: public bucket URL or custom domain
```

For local dev use `m8x-table-media-dev` as `R2_BUCKET_NAME`.

---

## 5. File key naming convention

All R2 keys follow the pattern:

```
{userId}/{resource}/{uuid}.{ext}
```

| Resource | Example key |
|----------|-------------|
| Recipe cover image | `user_abc/recipe-covers/550e8400-e29b-41d4-a716-446655440000.jpg` |
| Recipe step image | `user_abc/step-images/550e8400-e29b-41d4-a716-446655440000.jpg` |
| Recipe video | `user_abc/recipe-videos/550e8400-e29b-41d4-a716-446655440000.mp4` |
| Step video | `user_abc/step-videos/550e8400-e29b-41d4-a716-446655440000.mp4` |
| Profile picture | `user_abc/profile/avatar.jpg` |
| Book cover image | `user_abc/book-covers/550e8400-e29b-41d4-a716-446655440000.jpg` |
| Book EPUB | `user_abc/books/my-book_weeknight_2026-02-25_1430.epub` |

---

## 6. Upload flow in the app

Presigned URL approach (recommended for React Native):

1. App calls Worker API: `POST /api/upload-url` with `{ key, contentType }`
2. Worker generates a presigned PUT URL (15-minute expiry) and returns it
3. App uploads the file directly to R2 using the presigned URL
4. App saves the R2 key in D1 (recipe's `cover_image`, step's `image`, etc.)

---

## 7. Wrangler binding (for Workers)

In `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "m8x-table-media"

# Local dev
[[env.dev.r2_buckets]]
binding = "MEDIA"
bucket_name = "m8x-table-media-dev"
```
