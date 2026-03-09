/**
 * m8xtable Cloudflare Worker — API entry point.
 *
 * Serves recipe data from D1 and constructs R2 image URLs.
 * Run locally: npx wrangler dev --remote
 */

interface Env {
  m8xtable_db: D1Database;
  m8xtable_media: R2Bucket;
  m8xtable_media_dev: R2Bucket;
}

const R2_PUBLIC_URL = 'https://pub-aaed27c169424954a702b63c9cb530c2.r2.dev';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function corsPreflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

async function handleGetRecipes(env: Env, url: URL): Promise<Response> {
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return jsonResponse({ error: 'userId query parameter is required' }, 400);
  }

  const { results } = await env.m8xtable_db
    .prepare(
      `SELECT id, title, cover_image, category, difficulty,
              prep_time, cook_time, servings_min, servings_max, created_at
       FROM recipes
       WHERE owner_user_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)
       ORDER BY created_at DESC`
    )
    .bind(userId)
    .all();

  const recipes = (results ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    coverImageUrl: row.cover_image
      ? `${R2_PUBLIC_URL}/${row.cover_image}`
      : null,
    category: row.category,
    difficulty: row.difficulty,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    servingsMin: row.servings_min,
    servingsMax: row.servings_max,
    createdAt: row.created_at,
  }));

  return jsonResponse({ recipes });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return corsPreflightResponse();
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/recipes' && request.method === 'GET') {
      return handleGetRecipes(env, url);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
