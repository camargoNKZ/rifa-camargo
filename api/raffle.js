import { isAuthenticated, isSameOrigin } from './_auth.js';
import { readEntries, writeEntries } from './_store.js';

function normalizeEntry(input) {
  const number = Number(input.number);
  if (!Number.isInteger(number) || number < 1 || number > 100) throw new Error('Número inválido.');
  const name = String(input.name || '').trim().slice(0, 80);
  if (!name) throw new Error('Informe o nome do comprador.');
  const requestedAt = typeof input.requestedAt === 'string' ? input.requestedAt.slice(0, 40) : undefined;
  const source = input.source === 'site' ? 'site' : 'management';
  const contact = input.contact === 'livia' || input.contact === 'guilherme' ? input.contact : undefined;
  return { number, entry: { name, phone: String(input.phone || '').trim().slice(0, 24), paid: Boolean(input.paid), source, ...(contact ? { contact } : {}), ...(requestedAt ? { requestedAt } : {}) } };
}

export default {
  async fetch(request) {
    const authenticated = isAuthenticated(request);
    if (request.method === 'GET') {
      const entries = await readEntries();
      if (new URL(request.url).searchParams.get('admin') === '1') {
        if (!authenticated) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        return Response.json({ entries }, { headers: { 'Cache-Control': 'no-store' } });
      }
      const publicEntries = Object.fromEntries(Object.entries(entries).map(([number, entry]) => [number, { paid: Boolean(entry.paid) }]));
      return Response.json({ entries: publicEntries }, { headers: { 'Cache-Control': 'no-store' } });
    }

    if (!authenticated) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
    if (!isSameOrigin(request)) return Response.json({ error: 'Origem inválida.' }, { status: 403 });

    if (request.method === 'PUT') {
      try {
        const { number, entry } = normalizeEntry(await request.json());
        const entries = await readEntries();
        const previous = entries[number];
        entries[number] = {
          ...entry,
          source: previous?.source || entry.source,
          ...(previous?.contact ? { contact: previous.contact } : {}),
          ...(previous?.requestedAt ? { requestedAt: previous.requestedAt } : {}),
        };
        await writeEntries(entries);
        return Response.json({ number, entry: entries[number] }, { headers: { 'Cache-Control': 'no-store' } });
      } catch (error) {
        return Response.json({ error: error.message || 'Dados inválidos.' }, { status: 400 });
      }
    }

    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (!body.entries || typeof body.entries !== 'object') throw new Error('Dados inválidos.');
        const entries = {};
        for (const [rawNumber, rawEntry] of Object.entries(body.entries)) {
          const { number, entry } = normalizeEntry({ ...rawEntry, number: Number(rawNumber) });
          entries[number] = entry;
        }
        await writeEntries(entries);
        return Response.json({ entries }, { headers: { 'Cache-Control': 'no-store' } });
      } catch (error) {
        return Response.json({ error: error.message || 'Dados inválidos.' }, { status: 400 });
      }
    }

    if (request.method === 'DELETE') {
      let body;
      try { body = await request.json(); } catch { return Response.json({ error: 'Dados inválidos.' }, { status: 400 }); }
      const number = Number(body.number);
      if (!Number.isInteger(number) || number < 1 || number > 100) return Response.json({ error: 'Número inválido.' }, { status: 400 });
      const entries = await readEntries();
      delete entries[number];
      await writeEntries(entries);
      return Response.json({ number, status: 'free' }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return Response.json({ error: 'Método não permitido.' }, { status: 405 });
  },
};
