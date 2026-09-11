const form = document.querySelector('#loginForm');
const button = document.querySelector('#loginButton');
const error = document.querySelector('#loginError');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.hidden = true;
  button.disabled = true;
  button.textContent = 'Entrando…';
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.querySelector('#passwordInput').value }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível entrar.');
    window.location.replace('/gestao');
  } catch (cause) {
    error.textContent = cause.message || 'Não foi possível entrar.';
    error.hidden = false;
    button.disabled = false;
    button.textContent = 'Entrar na gestão';
  }
});
