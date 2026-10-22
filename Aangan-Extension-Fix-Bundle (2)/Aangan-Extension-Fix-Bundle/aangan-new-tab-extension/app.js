(() => {
  'use strict';

  const STORAGE_KEY = 'aanganSettings';
  const defaults = {
    displayName: '',
    searchEngine: 'google',
    showClock: true,
    shortcuts: [
      { name: 'Gmail', url: 'https://mail.google.com', symbol: '✉' },
      { name: 'YouTube', url: 'https://youtube.com', symbol: '▶' },
      { name: 'Maps', url: 'https://maps.google.com', symbol: '⌖' },
      { name: 'Drive', url: 'https://drive.google.com', symbol: '△' },
      { name: 'GitHub', url: 'https://github.com', symbol: '⌘' },
      { name: 'ChatGPT', url: 'https://chatgpt.com', symbol: '✳' }
    ]
  };

  let settings = structuredCloneSafe(defaults);
  let currentView = 'home';
  let isManaging = false;
  let toastTimer = null;
  let timerSeconds = 25 * 60;
  let timerRemaining = timerSeconds;
  let timerInterval = null;
  let timerRunning = false;
  let timerMode = 'focus';

  const mainView = document.getElementById('main-view');
  const topDate = document.getElementById('top-date');
  const settingsDialog = document.getElementById('settings-dialog');
  const shortcutDialog = document.getElementById('shortcut-dialog');
  const toast = document.getElementById('toast');

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  async function loadSettings() {
    try {
      if (globalThis.chrome?.storage?.local) {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (result && result[STORAGE_KEY]) settings = normalizeSettings(result[STORAGE_KEY]);
      } else {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) settings = normalizeSettings(JSON.parse(raw));
      }
    } catch (error) {
      console.warn('Aangan could not load saved preferences. Defaults will be used.', error);
    }
    renderView(currentView);
    updateClock();
    updateTopDate();
  }

  function normalizeSettings(input) {
    const result = { ...structuredCloneSafe(defaults), ...(input || {}) };
    result.displayName = typeof result.displayName === 'string' ? result.displayName.slice(0, 32) : '';
    result.searchEngine = ['google', 'duckduckgo', 'bing'].includes(result.searchEngine) ? result.searchEngine : 'google';
    result.showClock = result.showClock !== false;
    result.shortcuts = Array.isArray(result.shortcuts)
      ? result.shortcuts.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string').slice(0, 24)
      : structuredCloneSafe(defaults.shortcuts);
    return result;
  }

  async function saveSettings() {
    try {
      if (globalThis.chrome?.storage?.local) {
        await chrome.storage.local.set({ [STORAGE_KEY]: settings });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      }
    } catch (error) {
      console.error('Aangan could not save preferences.', error);
      showToast('Could not save this change. Try reloading the tab.');
    }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function safeURL(value) {
    let normalized = String(value || '').trim();
    if (!normalized) return null;
    if (!/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(normalized)) normalized = `https://${normalized}`;
    try {
      const url = new URL(normalized);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  function localDateParts(now = new Date()) {
    return {
      date: now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
      shortDate: now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      hour: now.getHours()
    };
  }

  function updateClock() {
    const clock = document.getElementById('clock');
    if (!clock) return;
    clock.textContent = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/\s/g, ' ').toLowerCase();
    clock.classList.toggle('hidden', !settings.showClock);
    const kicker = document.getElementById('date-kicker');
    if (kicker) kicker.textContent = localDateParts().date;
  }

  function updateTopDate() {
    topDate.textContent = localDateParts().shortDate;
  }

  function searchIcon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.5"></circle><path d="m16 16 4.2 4.2"></path></svg>';
  }

  function searchArrow() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"></path></svg>';
  }

  function symbolMarkup(item) {
    const symbol = escapeHTML(item.symbol || (item.name ? item.name.charAt(0).toUpperCase() : '↗'));
    return `<span class="shortcut-symbol" aria-hidden="true">${symbol}</span>`;
  }

  function shortcutMarkup(item, index, mode = 'home') {
    const url = safeURL(item.url);
    if (!url) return '';
    const name = escapeHTML(item.name);
    if (mode === 'home') {
      return `<a class="shortcut" href="${escapeHTML(url)}" title="Open ${name}" aria-label="Open ${name}">${symbolMarkup(item)}<span class="shortcut-label">${name}</span></a>`;
    }
    const host = escapeHTML(new URL(url).hostname.replace(/^www\./, ''));
    return `<div class="link-card" data-index="${index}"><a class="link-card-link" href="${escapeHTML(url)}" aria-label="Open ${name}" style="display:contents;color:inherit;text-decoration:none">${symbolMarkup(item)}<span class="link-card-copy"><strong>${name}</strong><small>${host}</small></span></a><button class="delete-shortcut" type="button" data-delete="${index}" aria-label="Remove ${name}" title="Remove shortcut">×</button></div>`;
  }

  function renderView(view) {
    currentView = view;
    document.querySelectorAll('[data-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.view === view);
      button.setAttribute('aria-current', button.dataset.view === view ? 'page' : 'false');
    });
    document.querySelectorAll('[data-view-link]').forEach(link => {
      link.setAttribute('aria-current', link.dataset.viewLink === view ? 'page' : 'false');
    });

    if (view === 'links') renderLinksView();
    else if (view === 'focus') renderFocusView();
    else renderHomeView();
    updateClock();
    mainView.focus({ preventScroll: true });
  }

  function renderHomeView() {
    const greeting = settings.displayName ? `Namaste, ${escapeHTML(settings.displayName)}` : 'Namaste';
    const shortcuts = settings.shortcuts.slice(0, 6).map((item, index) => shortcutMarkup(item, index)).join('');
    mainView.innerHTML = `
      <section class="home-view" aria-label="Home">
        <p class="date-kicker" id="date-kicker"></p>
        <p class="clock" id="clock" aria-label="Current time"></p>
        <h1 class="greeting">${greeting}<span class="accent">.</span></h1>
        <p class="tagline">A little calm. A fresh start.</p>
        <form class="search-wrap" id="search-form" role="search">
          <span class="search-icon">${searchIcon()}</span>
          <input id="search-input" type="search" autocomplete="off" spellcheck="false" aria-label="Search the web" placeholder="Search the web, or type a question…">
          <button class="search-submit" type="submit" aria-label="Search">${searchArrow()}</button>
        </form>
        <section class="shortcut-section" aria-label="Quick access">
          <div class="section-label-row">QUICK ACCESS</div>
          <div class="shortcut-grid">${shortcuts}<button type="button" class="shortcut shortcut-add" id="home-add-shortcut" aria-label="Add a shortcut"><span class="shortcut-symbol" aria-hidden="true">+</span><span class="shortcut-label">Add new</span></button></div>
        </section>
        <p class="home-quote"><b>आज का विचार</b> &nbsp;·&nbsp; Begin where you are.</p>
      </section>`;
    document.getElementById('search-form').addEventListener('submit', handleSearch);
    document.getElementById('home-add-shortcut').addEventListener('click', openShortcutDialog);
  }

  function renderLinksView() {
    const cards = settings.shortcuts.map((item, index) => shortcutMarkup(item, index, 'links')).join('');
    mainView.innerHTML = `
      <section class="content-view" aria-label="Your links">
        <div class="page-heading">
          <div><span class="eyebrow">YOUR PERSONAL CORNER</span><h1>Your links</h1><p>All the places you like to return to, gathered in one place.</p></div>
          <div class="heading-actions"><button type="button" class="quiet-button" id="manage-links">${isManaging ? 'Done editing' : 'Manage links'}</button><button type="button" class="primary-button" id="add-link">＋ Add link</button></div>
        </div>
        <div class="links-grid ${isManaging ? 'is-managing' : ''}" id="links-grid">${cards}<button class="add-link-card" id="add-link-card" type="button"><span aria-hidden="true">＋</span><span>Add another favourite</span></button></div>
        <p class="manage-note">${isManaging ? 'Tap × on a card to remove it. Your changes are saved on this device.' : 'Your shortcuts stay on this device and are ready whenever you open a new tab.'}</p>
      </section>`;
    document.getElementById('manage-links').addEventListener('click', () => { isManaging = !isManaging; renderLinksView(); });
    document.getElementById('add-link').addEventListener('click', openShortcutDialog);
    document.getElementById('add-link-card').addEventListener('click', openShortcutDialog);
    mainView.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async event => {
      const index = Number(event.currentTarget.dataset.delete);
      if (!Number.isInteger(index) || index < 0 || index >= settings.shortcuts.length) return;
      const [removed] = settings.shortcuts.splice(index, 1);
      await saveSettings();
      renderLinksView();
      showToast(`${removed.name} removed from your links.`);
    }));
  }

  function renderFocusView() {
    mainView.innerHTML = `
      <section class="content-view" aria-label="Focus timer">
        <div class="page-heading"><div><span class="eyebrow">A MOMENT FOR YOURSELF</span><h1>Make room to focus</h1><p>One thing at a time is enough.</p></div></div>
        <div class="focus-panel">
          <div class="focus-main">
            <h2 id="timer-title">A little focus</h2>
            <p id="timer-description">Settle in. You can begin again whenever you need.</p>
            <div class="timer-ring"><span class="timer-readout" id="timer-readout">25:00</span></div>
            <div class="timer-presets"><button class="preset-button active" type="button" data-preset="focus">Focus · 25 min</button><button class="preset-button" type="button" data-preset="break">Gentle break · 5 min</button></div>
            <div class="timer-buttons"><button type="button" class="primary-button" id="timer-toggle">Begin session <span aria-hidden="true">↗</span></button><button type="button" class="quiet-button" id="timer-reset">Reset</button></div>
          </div>
          <aside class="focus-aside"><span class="eyebrow">A SMALL REMINDER</span><h3>Slow is still progress.</h3><p>Choose one task, set everything else aside, and give this moment your attention. You don't need to do it all at once.</p><blockquote>“Little by little, a little becomes a lot.”</blockquote></aside>
        </div>
      </section>`;
    updateTimerDisplay();
    document.getElementById('timer-toggle').addEventListener('click', toggleTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => setTimerMode(button.dataset.preset)));
  }

  function handleSearch(event) {
    event.preventDefault();
    const input = document.getElementById('search-input');
    const query = input.value.trim();
    if (!query) { input.focus(); return; }
    const engines = {
      google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`
    };
    window.location.assign(engines[settings.searchEngine] || engines.google);
  }

  function openSettingsDialog() {
    document.getElementById('display-name').value = settings.displayName;
    document.getElementById('search-engine').value = settings.searchEngine;
    document.getElementById('show-clock').checked = settings.showClock;
    if (!settingsDialog.open) settingsDialog.showModal();
  }

  function openShortcutDialog() {
    document.getElementById('shortcut-form').reset();
    if (!shortcutDialog.open) shortcutDialog.showModal();
    window.setTimeout(() => document.getElementById('shortcut-name').focus(), 20);
  }

  function closeDialogs() {
    [settingsDialog, shortcutDialog].forEach(dialog => { if (dialog.open) dialog.close(); });
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2400);
  }

  async function handleSettingsSubmit(event) {
    event.preventDefault();
    settings.displayName = document.getElementById('display-name').value.trim().slice(0, 32);
    settings.searchEngine = document.getElementById('search-engine').value;
    settings.showClock = document.getElementById('show-clock').checked;
    await saveSettings();
    settingsDialog.close();
    renderView(currentView);
    showToast('Your preferences are saved.');
  }

  async function handleShortcutSubmit(event) {
    event.preventDefault();
    if (settings.shortcuts.length >= 24) {
      showToast('You can keep up to 24 shortcuts.');
      return;
    }
    const name = document.getElementById('shortcut-name').value.trim().slice(0, 28);
    const enteredUrl = document.getElementById('shortcut-url').value.trim();
    const url = safeURL(enteredUrl);
    if (!name || !url) {
      showToast('Enter a name and a valid http or https website.');
      return;
    }
    if (settings.shortcuts.some(item => safeURL(item.url) === url)) {
      showToast('That website is already in your links.');
      return;
    }
    settings.shortcuts.push({ name, url, symbol: name.charAt(0).toUpperCase() });
    await saveSettings();
    shortcutDialog.close();
    renderView(currentView);
    showToast(`${name} added to your links.`);
  }

  function setTimerMode(mode) {
    pauseTimer();
    timerMode = mode === 'break' ? 'break' : 'focus';
    timerSeconds = timerMode === 'break' ? 5 * 60 : 25 * 60;
    timerRemaining = timerSeconds;
    document.querySelectorAll('[data-preset]').forEach(button => button.classList.toggle('active', button.dataset.preset === timerMode));
    const title = document.getElementById('timer-title');
    const description = document.getElementById('timer-description');
    if (title) title.textContent = timerMode === 'break' ? 'A gentle pause' : 'A little focus';
    if (description) description.textContent = timerMode === 'break' ? 'Let your shoulders soften. Take a breath.' : 'Settle in. You can begin again whenever you need.';
    updateTimerDisplay();
    updateTimerButton();
  }

  function updateTimerDisplay() {
    const readout = document.getElementById('timer-readout');
    if (!readout) return;
    const minutes = Math.floor(timerRemaining / 60).toString().padStart(2, '0');
    const seconds = Math.max(0, timerRemaining % 60).toString().padStart(2, '0');
    readout.textContent = `${minutes}:${seconds}`;
  }

  function updateTimerButton() {
    const button = document.getElementById('timer-toggle');
    if (button) button.innerHTML = `${timerRunning ? 'Pause session' : 'Begin session'} <span aria-hidden="true">${timerRunning ? 'Ⅱ' : '↗'}</span>`;
  }

  function pauseTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    updateTimerButton();
  }

  function toggleTimer() {
    if (timerRunning) { pauseTimer(); return; }
    if (timerRemaining <= 0) timerRemaining = timerSeconds;
    timerRunning = true;
    updateTimerButton();
    timerInterval = setInterval(() => {
      timerRemaining -= 1;
      updateTimerDisplay();
      if (timerRemaining <= 0) {
        pauseTimer();
        timerRemaining = 0;
        updateTimerDisplay();
        showToast(timerMode === 'break' ? 'Your pause is complete. Welcome back.' : 'Your focus session is complete. Take a breath.');
      }
    }, 1000);
  }

  function resetTimer() {
    pauseTimer();
    timerRemaining = timerSeconds;
    updateTimerDisplay();
  }

  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    isManaging = false;
    renderView(button.dataset.view);
  }));
  document.querySelectorAll('[data-view-link]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    renderView(link.dataset.viewLink || 'home');
  }));
  document.getElementById('open-settings').addEventListener('click', openSettingsDialog);
  document.getElementById('settings-form').addEventListener('submit', handleSettingsSubmit);
  document.getElementById('shortcut-form').addEventListener('submit', handleShortcutSubmit);
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', closeDialogs));
  [settingsDialog, shortcutDialog].forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  }));

  // Press / to jump straight to the search field, except while typing in a control.
  document.addEventListener('keydown', event => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const editing = ['input', 'textarea', 'select'].includes(tag) || document.activeElement?.isContentEditable;
    if (event.key === '/' && !editing && currentView === 'home') {
      event.preventDefault();
      document.getElementById('search-input')?.focus();
    }
    if (event.key === 'Escape') closeDialogs();
  });

  window.setInterval(() => { updateClock(); updateTopDate(); }, 15000);
  loadSettings();
})();
