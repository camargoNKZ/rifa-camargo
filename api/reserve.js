import { isSameOrigin } from './_auth.js';
import { readEntries, writeEntries } from './_store.js';

function normalizePhone(value) {
  const phone = String(value || '').trim().slice(0, 24);
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) throw new Error('Informe um WhatsApp válido.');
  return phone;
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return Response.json({ error: 'Método não permitido.' }, { status: 405 });
    if (!isSameOrigin(request)) return Response.json({ error: 'Origem inválida.' }, { status: 403 });

    try {
      const body = await request.json();
      const requestedNumbers = Array.isArray(body.numbers) ? body.numbers : [body.number];
      const numbers = [...new Set(requestedNumbers.map(Number))].sort((left, right) => left - right);
      if (!numbers.length || numbers.some((number) => !Number.isInteger(number) || number < 1 || number > 100)) throw new Error('Seleção de números inválida.');
      const name = String(body.name || '').trim().slice(0, 80);
      if (!name) throw new Error('Informe seu nome.');
      const phone = normalizePhone(body.phone);
      const contact = body.contact === 'livia' || body.contact === 'guilherme' ? body.contact : null;
      if (!contact) throw new Error('Escolha Lívia ou Guilherme para fazer a reserva.');

      const entries = await readEntries();
      const unavailable = numbers.filter((number) => entries[number]);
      if (unavailable.length) {
        const list = unavailable.map((number) => String(number).padStart(2, '0')).join(', ');
        return Response.json({ error: `Os números ${list} acabaram de ser reservados. Atualize sua seleção.` }, { status: 409 });
      }

      const requestedAt = new Date().toISOString();
      numbers.forEach((number) => {
        entries[number] = { name, phone, paid: false, source: 'site', contact, requestedAt };
      });
      await writeEntries(entries);

      return Response.json({ numbers, entries: Object.fromEntries(numbers.map((number) => [number, { paid: false }])) }, {
        status: 201,
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (error) {
      return Response.json({ error: error.message || 'Dados inválidos.' }, { status: 400 });
    }
  },
};
