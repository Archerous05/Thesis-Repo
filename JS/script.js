const demoAccounts = [
  { role: 'student', email: 'student@demo.com', password: 'student123', redirect: 'dashboard.html' }
];

function setStatus(message, type) {
  const status = document.getElementById('statusMsg');
  if (!status) return;
  status.textContent = message;
  status.classList.remove('status-error', 'status-success');

  const emailField = document.getElementById('email');
  const passField = document.getElementById('password');

  if (emailField) emailField.classList.remove('input-error', 'input-success');
  if (passField) passField.classList.remove('input-error', 'input-success');

  if (type === 'success') {
    status.classList.add('status-success');
    if (emailField) emailField.classList.add('input-success');
    if (passField) passField.classList.add('input-success');
  } else if (type === 'error') {
    status.classList.add('status-error');
    if (emailField) emailField.classList.add('input-error');
    if (passField) passField.classList.add('input-error');
  }

  clearTimeout(window._loginStatusTimeout);
  window._loginStatusTimeout = setTimeout(() => {
    if (status) {
      status.textContent = '';
      status.classList.remove('status-error', 'status-success');
    }
    if (emailField) emailField.classList.remove('input-error', 'input-success');
    if (passField) passField.classList.remove('input-error', 'input-success');
  }, 3000);
}

function login() {
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const email = emailEl ? emailEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : '';

  const account = demoAccounts.find(a => a.email === email && a.password === password);
  if (account) {
    setStatus('Successfully logged in as ' + account.role + '.', 'success');
    setTimeout(() => { window.location.href = account.redirect; }, 700);
    return;
  }

  setStatus('Invalid credentials. Try the demo account.', 'error');
}

function signup() {
  alert("Account created!");
  window.location.href = "login.html";
}

document.addEventListener('DOMContentLoaded', function () {
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) loginBtn.addEventListener('click', login);
  const demoSelect = document.getElementById('demoSelect');
  if (demoSelect) demoSelect.addEventListener('change', function () {
    const role = demoSelect.value;
    const acc = demoAccounts.find(a => a.role === role);
    const emailField = document.getElementById('email');
    const passField = document.getElementById('password');
    const roleField = document.getElementById('role');
    if (acc) {
      if (emailField) emailField.value = acc.email;
      if (passField) passField.value = acc.password;
      if (roleField) roleField.value = acc.role;
    } else {
      if (emailField) emailField.value = '';
      if (passField) passField.value = '';
      if (roleField) roleField.value = '';
    }
  });

  attachSaveButtons();
  initializeInlineSaveButtons();
  renderSavedPage();
});


const STORAGE_KEY = 'ollc_saved_items_v1';

function getSavedItems() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}

function storeSavedItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isSaved(id) {
  return getSavedItems().some(i => i.id === id);
}

function saveItem(item) {
  const items = getSavedItems();
  if (!items.find(i => i.id === item.id)) {
    items.push(item);
    storeSavedItems(items);
  }
}

function removeSaved(id) {
  let items = getSavedItems();
  items = items.filter(i => i.id !== id);
  storeSavedItems(items);
}

function updateSaveButton(btn, id) {
  if (!btn) return;
  const saved = isSaved(id);
  btn.classList.toggle('saved', saved);
  btn.textContent = saved ? 'Saved' : 'Save';
  btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
}

function attachSaveButtons() {
  const cards = document.querySelectorAll('.card-item');
  cards.forEach((card, idx) => {

    let cid = card.dataset.cardId;
    if (!cid) {
      cid = (card.getAttribute('data-id') || (`card:${location.pathname}:${idx}`)).replace(/\s+/g, '-');
      card.dataset.cardId = cid;
    }

    const rawTitle = (card.querySelector('.card-title')?.innerText || card.innerText || '').trim();
    card.dataset.cardTitle = rawTitle;

    if (card.querySelector('.save-btn')) {
      updateSaveButton(card.querySelector('.save-btn'), cid);
      return;
    }

    const btn = document.createElement('button');
    btn.className = 'save-btn';
    btn.type = 'button';
    btn.title = 'Save to library';
    updateSaveButton(btn, cid);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const title = card.dataset.cardTitle || rawTitle || ('Untitled ' + cid);
      if (isSaved(cid)) {
        removeSaved(cid);
      } else {
        saveItem({ id: cid, title: title, src: location.pathname });
      }
      document.querySelectorAll(`[data-card-id="${cid}"] .save-btn`).forEach(b => updateSaveButton(b, cid));
      if (document.getElementById('savedList')) renderSavedPage();
    });

    btn.style.float = 'right';
    card.appendChild(btn);
  });
}

function renderSavedPage() {
  const list = document.getElementById('savedList');
  if (!list) return;
  const items = getSavedItems();
  list.innerHTML = '';
  if (!items || items.length === 0) {
    list.innerHTML = '<div class="card-item">No saved items yet. Browse papers and click Save.</div>';
    return;
  }

  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'card-item';
    div.dataset.cardId = it.id;
    div.innerHTML = `<div class="card-title">${it.title}</div><div class="card-meta">Source: ${it.src || ''}</div>`;
    list.appendChild(div);
  });

  attachSaveButtons();
}

function initializeInlineSaveButtons() {
  const inlineBtns = document.querySelectorAll('.paper-card .save-btn');
  inlineBtns.forEach((btn, idx) => {
    const card = btn.closest('.paper-card');
    if (!card) return;
    
    let cid = card.dataset.cardId;
    if (!cid) {
      cid = (`viewer:${location.pathname}`).replace(/\s+/g, '-');
      card.dataset.cardId = cid;
    }

    const titleEl = card.querySelector('.paper-title');
    if (titleEl) card.dataset.cardTitle = titleEl.innerText.trim();

    updateSaveButton(btn, cid);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const title = card.dataset.cardTitle || ('Untitled ' + cid);
      if (isSaved(cid)) removeSaved(cid);
      else saveItem({ id: cid, title: title, src: location.pathname });

      document.querySelectorAll(`[data-card-id="${cid}"] .save-btn`).forEach(b => updateSaveButton(b, cid));

      updateSaveButton(btn, cid);
      if (document.getElementById('savedList')) renderSavedPage();
    });
  });
}
