import { get, list, put } from '@vercel/blob';

const SNAPSHOT_PREFIX = 'rifa/snapshots/';

export async function readEntries() {
  try {
    const page = await list({ prefix: SNAPSHOT_PREFIX, limit: 1000 });
    const latest = page.blobs.sort((left, right) => right.pathname.localeCompare(left.pathname))[0];
    if (!latest) return {};
    const result = await get(latest.pathname, { access: 'private' });
    if (!result || result.statusCode !== 200) return {};
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error?.statusCode === 404 || error?.code === 'blob_not_found') return {};
    throw error;
  }
}

export async function writeEntries(entries) {
  const timestamp = String(Date.now()).padStart(13, '0');
  await put(`${SNAPSHOT_PREFIX}${timestamp}-${crypto.randomUUID()}.json`, JSON.stringify(entries), {
    access: 'private',
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}
