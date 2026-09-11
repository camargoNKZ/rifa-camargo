import { createSessionCookie, isSameOrigin, passwordMatches } from './_auth.js';

export default {
  async fetch(request) {
    if (request.method !== 'POST') return Response.json({ error: 'Método não permitido.' }, { status: 405 });
    if (!isSameOrigin(request)) return Response.json({ error: 'Origem inválida.' }, { status: 403 });
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Dados inválidos.' }, { status: 400 }); }
    if (!passwordMatches(body.password)) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return Response.json({ error: 'Senha incorreta.' }, { status: 401 });
    }
    return Response.json({ ok: true }, { headers: { 'Set-Cookie': createSessionCookie(), 'Cache-Control': 'no-store' } });
  },
};
