const LEGACY_STORAGE_KEY = 'camargo-rifa-v1';
const mode = document.body.dataset.mode || 'consulta';
const isManagement = mode === 'gestao';
const state = { entries: {}, filter: 'all', search: '', loading: true, selected: new Set() };

const grid = document.querySelector('#numbersGrid');
const toast = document.querySelector('#toast');
const entryDialog = document.querySelector('#entryDialog');
const requestDialog = document.querySelector('#requestDialog');
let pendingDeleteNumber = null;
let deleteResetTimer;

function statusFor(entry) { return !entry ? 'free' : entry.paid ? 'paid' : 'reserved'; }
function formatNumber(number) { return String(number).padStart(2, '0'); }

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    cache: 'no-store',
  });
  let result = {};
  try { result = await response.json(); } catch {}
  if (response.status === 401 && isManagement) {
    window.location.replace('/login');
    throw new Error('Sessão encerrada.');
  }
  if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a operação.');
  return result;
}

async function loadRemoteEntries({ quiet = false } = {}) {
  try {
    const result = await api(`/api/raffle${isManagement ? '?admin=1' : ''}`);
    state.entries = result.entries || {};
    state.loading = false;
    if (isManagement) await migrateLegacyData();
    render();
  } catch (error) {
    state.loading = false;
    if (!quiet && !String(error.message).includes('Sessão encerrada')) showToast(error.message);
    render();
  }
}

async function migrateLegacyData() {
  if (Object.keys(state.entries).length) return;
  let legacy = {};
  try { legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || '{}'); } catch {}
  if (!Object.keys(legacy).length) return;
  const result = await api('/api/raffle', { method: 'POST', body: JSON.stringify({ entries: legacy }) });
  state.entries = result.entries || {};
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  showToast('Dados anteriores sincronizados online.');
}

function render() {
  grid.setAttribute('aria-busy', String(state.loading));
  [...state.selected].forEach((number) => { if (state.entries[number]) state.selected.delete(number); });
  const query = state.search.trim().toLocaleLowerCase('pt-BR');
  const visible = Array.from({ length: 100 }, (_, index) => index + 1).filter((number) => {
    const entry = state.entries[number];
    const matchesFilter = state.filter === 'all' || state.filter === statusFor(entry);
    const matchesSearch = !query || formatNumber(number).includes(query) || (isManagement && entry?.name.toLocaleLowerCase('pt-BR').includes(query));
    return matchesFilter && matchesSearch;
  });

  grid.innerHTML = visible.map((number) => {
    const entry = state.entries[number];
    const status = statusFor(entry);
    const buyer = isManagement && entry ? `<small>${escapeHtml(entry.name)}</small>` : '';
    const label = isManagement && entry
      ? `Número ${number}, ${escapeHtml(entry.name)}, ${entry.paid ? 'pago' : 'reservado'}`
      : `Número ${number}, ${status === 'free' ? 'livre, toque para solicitar' : status === 'paid' ? 'indisponível' : 'reservado'}`;
    const selected = !isManagement && state.selected.has(number);
    return `<button class="number ${status}${selected ? ' selected' : ''}" data-number="${number}" type="button" aria-label="${label}" ${!isManagement ? `aria-pressed="${selected}"` : ''} ${state.loading || (!isManagement && status !== 'free') ? 'aria-disabled="true"' : ''}><span>${formatNumber(number)}</span>${buyer}</button>`;
  }).join('');

  document.querySelector('#emptyState').hidden = visible.length > 0;
  const entries = Object.values(state.entries);
  document.querySelector('#freeCount').textContent = state.loading ? '—' : 100 - entries.length;
  document.querySelector('#reservedCount').textContent = state.loading ? '—' : entries.filter((entry) => !entry.paid).length;
  document.querySelector('#paidCount').textContent = state.loading ? '—' : entries.filter((entry) => entry.paid).length;
  if (!isManagement) updateSelectionBar();
}

function openEntry(number) {
  const entry = state.entries[number];
  document.querySelector('#numberInput').value = number;
  document.querySelector('#dialogNumber').textContent = formatNumber(number);
  document.querySelector('#nameInput').value = entry?.name || '';
  document.querySelector('#phoneInput').value = entry?.phone || '';
  document.querySelector('#paidInput').checked = Boolean(entry?.paid);
  document.querySelector('#deleteEntry').hidden = !entry;
  resetDeleteButton();
  const reservationMeta = document.querySelector('#reservationMeta');
  const contactName = entry?.contact === 'livia' ? 'Lívia' : entry?.contact === 'guilherme' ? 'Guilherme' : '';
  reservationMeta.hidden = !contactName;
  if (contactName) reservationMeta.textContent = `Reserva recebida pelo WhatsApp de ${contactName}.`;
  const buyerWhatsapp = document.querySelector('#buyerWhatsapp');
  const whatsappNumber = phoneForWhatsApp(entry?.phone);
  buyerWhatsapp.hidden = !whatsappNumber;
  if (whatsappNumber) {
    const message = `Olá, ${entry.name}! Estou entrando em contato sobre o pagamento do número ${formatNumber(number)} da Rifa Doce.`;
    buyerWhatsapp.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
  entryDialog.showModal();
  setTimeout(() => document.querySelector('#nameInput').focus(), 50);
}

function openRequest() {
  const numbers = selectedNumbers();
  if (!numbers.length) return;
  document.querySelector('#requestForm').reset();
  document.querySelector('#requestNumbers').textContent = formatNumberList(numbers);
  document.querySelector('#requestTotal').textContent = formatCurrency(numbers.length * 10);
  document.querySelector('#requestDetails').hidden = false;
  document.querySelector('#paymentStep').hidden = true;
  requestDialog.showModal();
  setTimeout(() => document.querySelector('#requestName').focus(), 50);
}

grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-number]');
  if (!button || state.loading) return;
  const number = Number(button.dataset.number);
  if (isManagement) openEntry(number);
  else if (!state.entries[number]) {
    if (state.selected.has(number)) state.selected.delete(number);
    else state.selected.add(number);
    render();
  }
  else showToast('Este número não está disponível.');
});

document.querySelector('#searchInput').addEventListener('input', (event) => {
  state.search = event.target.value;
  render();
});

document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  state.filter = button.dataset.filter;
  render();
}));

if (isManagement) {
  document.querySelector('#entryForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const number = Number(document.querySelector('#numberInput').value);
    const entry = {
      number,
      name: document.querySelector('#nameInput').value,
      phone: document.querySelector('#phoneInput').value,
      paid: document.querySelector('#paidInput').checked,
    };
    try {
      const result = await api('/api/raffle', { method: 'PUT', body: JSON.stringify(entry) });
      state.entries[number] = result.entry;
      entryDialog.close();
      render();
      showToast(`Número ${formatNumber(number)} salvo e sincronizado.`);
    } catch (error) { showToast(error.message); }
  });

  document.querySelector('#deleteEntry').addEventListener('click', async () => {
    const number = Number(document.querySelector('#numberInput').value);
    const deleteButton = document.querySelector('#deleteEntry');
    if (pendingDeleteNumber !== number) {
      pendingDeleteNumber = number;
      deleteButton.textContent = `Confirmar liberação do ${formatNumber(number)}`;
      deleteButton.classList.add('confirming');
      clearTimeout(deleteResetTimer);
      deleteResetTimer = setTimeout(resetDeleteButton, 6000);
      showToast('Toque novamente para confirmar a liberação.');
      return;
    }
    deleteButton.disabled = true;
    deleteButton.textContent = 'Liberando…';
    try {
      await api('/api/raffle', { method: 'DELETE', body: JSON.stringify({ number }) });
      delete state.entries[number];
      entryDialog.close();
      render();
      showToast(`Número ${formatNumber(number)} liberado.`);
    } catch (error) {
      showToast(error.message);
    } finally {
      deleteButton.disabled = false;
      resetDeleteButton();
    }
  });

  document.querySelector('#closeDialog').addEventListener('click', () => {
    resetDeleteButton();
    entryDialog.close();
  });
  document.querySelector('#exportCsv').addEventListener('click', exportCsv);
  document.querySelector('#backupJson').addEventListener('click', () => download(`backup-rifa-${dateStamp()}.json`, JSON.stringify({ version: 2, entries: state.entries }, null, 2), 'application/json'));
  document.querySelector('#restoreJson').addEventListener('change', restoreBackup);
  document.querySelector('#logoutButton').addEventListener('click', async () => {
    try { await api('/api/logout', { method: 'POST', body: '{}' }); } finally { window.location.replace('/login'); }
  });
} else {
  document.querySelector('#closeRequest').addEventListener('click', () => requestDialog.close());
  document.querySelector('#requestForm').addEventListener('submit', (event) => event.preventDefault());
  document.querySelectorAll('[data-reservation-contact]').forEach((button) => button.addEventListener('click', () => reserveNumber(button.dataset.reservationContact)));
  document.querySelector('#copyPixButton')?.addEventListener('click', copyPixCode);
  document.querySelector('#finishReservation').addEventListener('click', () => requestDialog.close());
  document.querySelector('#openReservation').addEventListener('click', openRequest);
  document.querySelector('#clearSelection').addEventListener('click', () => {
    state.selected.clear();
    render();
  });
}

setInterval(() => loadRemoteEntries({ quiet: true }), 15000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') loadRemoteEntries({ quiet: true });
});

function resetDeleteButton() {
  pendingDeleteNumber = null;
  clearTimeout(deleteResetTimer);
  const deleteButton = document.querySelector('#deleteEntry');
  if (!deleteButton) return;
  deleteButton.textContent = 'Liberar número';
  deleteButton.classList.remove('confirming');
}

async function copyPixCode() {
  const pixCode = document.querySelector('#pixCode')?.textContent.trim();
  if (!pixCode) return;
  try {
    await navigator.clipboard.writeText(pixCode);
    showToast('Código Pix copiado.');
  } catch {
    prompt('Copie o código Pix:', pixCode);
  }
}

async function reserveNumber(contactKey) {
  const form = document.querySelector('#requestForm');
  if (!form.reportValidity()) return;
  const numbers = selectedNumbers();
  if (!numbers.length || numbers.some((number) => state.entries[number])) {
    requestDialog.close();
    showToast('Um dos números ficou indisponível. Atualize sua seleção.');
    await loadRemoteEntries({ quiet: true });
    return;
  }
  const name = document.querySelector('#requestName').value.trim();
  const phone = document.querySelector('#requestPhone').value.trim();
  const contacts = {
    livia: { phone: '5519991764004', name: 'Lívia' },
    guilherme: { phone: '5512988514239', name: 'Guilherme' },
  };
  const contact = contacts[contactKey];
  if (!contact) return;
  const contactButtons = [...document.querySelectorAll('[data-reservation-contact]')];
  contactButtons.forEach((button) => { button.disabled = true; });
  try {
    const result = await api('/api/reserve', { method: 'POST', body: JSON.stringify({ numbers, name, phone, contact: contactKey }) });
    Object.assign(state.entries, result.entries);
    state.selected.clear();
    render();
    document.querySelector('#reservedNumbers').textContent = formatNumberList(numbers);
    document.querySelector('#paymentTotal').textContent = formatCurrency(numbers.length * 10);
    const message = `Olá, ${contact.name}! Eu sou ${name} e reservei ${numbers.length === 1 ? 'o número' : 'os números'} ${formatNumberList(numbers)} da Rifa Doce. Total: ${formatCurrency(numbers.length * 10)}. Meu WhatsApp é ${phone}. Vou enviar o comprovante por aqui.`;
    const whatsappUrl = `https://wa.me/${contact.phone}?text=${encodeURIComponent(message)}`;
    document.querySelector('#reopenWhatsapp').href = whatsappUrl;
    document.querySelector('#requestDetails').hidden = true;
    document.querySelector('#paymentStep').hidden = false;
    window.open(whatsappUrl, '_blank', 'noopener');
    showToast(`${numbers.length === 1 ? 'Número reservado' : 'Números reservados'} com sucesso.`);
  } catch (error) {
    showToast(error.message);
    if (String(error.message).includes('reservad')) {
      requestDialog.close();
      await loadRemoteEntries({ quiet: true });
    }
  } finally {
    contactButtons.forEach((button) => { button.disabled = false; });
  }
}

function phoneForWhatsApp(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length === 12 || digits.length === 13 ? digits : '';
}

function selectedNumbers() { return [...state.selected].sort((left, right) => left - right); }
function formatNumberList(numbers) { return numbers.map(formatNumber).join(', '); }
function formatCurrency(value) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

function updateSelectionBar() {
  const numbers = selectedNumbers();
  const selectionBar = document.querySelector('#selectionBar');
  selectionBar.hidden = numbers.length === 0;
  document.querySelector('#selectionCount').textContent = numbers.length;
  document.querySelector('#selectionTotal').textContent = formatCurrency(numbers.length * 10);
  document.querySelector('#selectionNumbers').textContent = formatNumberList(numbers);
}

function exportCsv() {
  const rows = [['Número', 'Comprador', 'Telefone', 'Status']];
  Object.entries(state.entries).sort(([a], [b]) => Number(a) - Number(b)).forEach(([number, entry]) => rows.push([formatNumber(number), entry.name, entry.phone, entry.paid ? 'Pago' : 'Reservado']));
  const csv = '\ufeff' + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\n');
  download(`rifa-doce-${dateStamp()}.csv`, csv, 'text/csv;charset=utf-8');
}

async function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (!backup.entries || typeof backup.entries !== 'object') throw new Error('Este arquivo de backup não é válido.');
    const result = await api('/api/raffle', { method: 'POST', body: JSON.stringify({ entries: backup.entries }) });
    state.entries = result.entries || {};
    render();
    showToast('Backup restaurado e sincronizado.');
  } catch (error) { showToast(error.message); }
  event.target.value = '';
}

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
}

function dateStamp() { return new Date().toISOString().slice(0, 10); }
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  context.registerTool({
    name: 'list_raffle_numbers', title: 'Consultar números da rifa',
    description: 'Lista a disponibilidade online dos 100 números sem expor dados pessoais.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => ({ numbers: Array.from({ length: 100 }, (_, index) => ({ number: index + 1, status: statusFor(state.entries[index + 1]) })) }),
  }, options);
}

render();
loadRemoteEntries();
registerWebMcpTools();
