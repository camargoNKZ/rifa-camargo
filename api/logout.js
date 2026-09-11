import { clearSessionCookie, isSameOrigin } from './_auth.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return Response.json({ error: 'Método não permitido.' }, { status: 405 });
    if (!isSameOrigin(request)) return Response.json({ error: 'Origem inválida.' }, { status: 403 });
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie(), 'Cache-Control': 'no-store' } });
  },
};
