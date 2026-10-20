// =====================================================
// MoatBench — Main Application
// Vanilla JS, no dependencies.
// =====================================================

(function () {
  'use strict';

  /* ---- Base URL resolution ---- */
  const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
    ? import.meta.env.BASE_URL
    : '/';

  function assetUrl(path) {
    const p = path.startsWith('/') ? path.substring(1) : path;
    return BASE_URL + p;
  }

  /* ---- State ---- */
  let evaluationData = null;
  let equipmentData = null;
  let filteredResults = [];
  let currentDossierId = null;
  let showAllModels = false;
  let watchTimerInterval = null;

  /* ---- DOM refs ---- */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ---- Formatting helpers ---- */
  function fmtLatency(ms) {
    if (ms == null) return '—';
    if (ms < 1000) return Math.round(ms) + ' ms';
    return (ms / 1000).toFixed(1) + ' s';
  }

  function fmtCost(usd) {
    if (usd == null) return '—';
    if (usd < 0.001) return '< $0.01';
    return '$' + usd.toFixed(4);
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toUTCString().replace(' GMT', '');
    } catch { return iso; }
  }

  function fmtTokens(n) {
    if (n == null) return '—';
    return n.toLocaleString();
  }

  function extractProvider(modelId) {
    if (!modelId) return 'unknown';
    const parts = modelId.split('/');
    return parts.length > 1 ? parts[0] : 'unknown';
  }

  /* ---- Data loading ---- */
  async function loadData() {
    const evalUrl = BASE_URL + 'data/evaluations.json';
    const equipUrl = BASE_URL + 'data/equipment.json';

    try {
      const resp = await fetch(evalUrl, { cache: 'no-cache' });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      evaluationData = await resp.json();
    } catch (err) {
      console.warn('MoatBench: evaluations.json not available yet —', err.message);
      evaluationData = null;
    }

    try {
      const resp = await fetch(equipUrl, { cache: 'no-cache' });
      if (resp.ok) {
        equipmentData = await resp.json();
      }
    } catch { /* equipment is optional */ }
  }

  /* ---- Render everything ---- */
  function renderAll() {
    renderMetrics();
    renderLeaderboard();
    renderEquipment();
    loadPhotoCredit();
    processHash();
  }

  async function loadPhotoCredit() {
    try {
      const response = await fetch(assetUrl('data/assets.json'));
      if (!response.ok) return;
      const data = await response.json();
      const asset = (data.assets || []).find(a => a.path?.endsWith('sandcastle.jpg'));
      const link = document.getElementById('photoCredit');
      if (asset && link) {
        link.href = asset.sourceUrl;
        link.textContent = (asset.creator || 'Photo source') + ' ↗';
        link.target = '_blank'; link.rel = 'noopener noreferrer';
      }
    } catch { /* The local attribution record remains available. */ }
  }

  /* ---- Metrics ---- */
  function renderMetrics() {
    const elModels = document.getElementById('metricModels');
    const elBest = document.getElementById('metricBest');
    const elTrials = document.getElementById('metricTrials');

    if (!evaluationData || !evaluationData.results) {
      elModels.textContent = '—';
      elBest.textContent = '—';
      elTrials.textContent = '0';
      return;
    }

    const results = evaluationData.results;
    elModels.textContent = String(results.length);
    elBest.textContent = '0%';
    elTrials.textContent = '0';
  }

  /* ---- Leaderboard ---- */
  function renderLeaderboard() {
    const tbody = document.getElementById('lbBody');
    const meta = document.getElementById('leaderboardMeta');
    const status = document.getElementById('filterStatus');

    if (!evaluationData || !evaluationData.results) {
      tbody.innerHTML = '<tr><td colspan="8" class="lb-empty">Dataset not yet available. Results will appear here once evaluations are collected.</td></tr>';
      meta.textContent = '';
      status.textContent = '';
      return;
    }

    const results = evaluationData.results.filter(r => r.finishReason != null && r.responseText != null);
    const errors = evaluationData.errors || [];

    // Populate provider filter
    const providerSet = new Set();
    results.forEach(r => providerSet.add(extractProvider(r.modelId)));
    const providers = Array.from(providerSet).sort();
    const sel = document.getElementById('lbProvider');
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">All providers</option>' +
      providers.map(p => `<option value="${p}">${p}</option>`).join('');
    sel.value = currentVal;

    // Filter + sort
    const searchQ = document.getElementById('lbSearch').value.toLowerCase().trim();
    const providerF = document.getElementById('lbProvider').value;
    const sortMode = document.getElementById('lbSort').value;

    filteredResults = results.filter(r => {
      if (providerF && extractProvider(r.modelId) !== providerF) return false;
      if (searchQ) {
        const q = searchQ;
        const haystack = (r.displayName + ' ' + r.modelId + ' ' + r.responseText).toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    // Sort
    const sorted = [...filteredResults];
    if (sortMode === 'alpha') {
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else if (sortMode === 'latency') {
      sorted.sort((a, b) => (a.latencyMs || 0) - (b.latencyMs || 0));
    } else if (sortMode === 'length') {
      sorted.sort((a, b) => (a.responseText || '').length - (b.responseText || '').length);
    }

    const hasFilters = Boolean(searchQ || providerF);
    const firstCount = window.matchMedia('(max-width: 720px)').matches ? 6 : 12;
    const visible = hasFilters || showAllModels ? sorted : sorted.slice(0, firstCount);

    // Render rows
    if (sorted.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="lb-empty">No results match your filters.</td></tr>';
    } else {
      tbody.innerHTML = visible.map((r, i) => {
        const excerpt = (r.responseText || '').substring(0, 120);
        const excerptClean = escHtml(excerpt);
        const lat = fmtLatency(r.latencyMs);
        const soilStr = r.observedSoilM3 != null ? r.observedSoilM3 + ' m³' : '—';
        const completionStr = r.completionPercent !== null ? r.completionPercent + '%' : '—';
        const rank = '=';

        return `<tr>
          <td class="col-rank" data-label="#">${rank}</td>
          <td data-label="Entrant">
            <span class="entrant-name">${escHtml(r.displayName)}</span>
            <span class="entrant-provider">${escHtml(extractProvider(r.modelId))}</span>
          </td>
          <td data-label="Model"><span class="model-id">${escHtml(r.modelId)}</span></td>
          <td data-label="Response"><span class="excerpt-text">${excerptClean}${(r.responseText || '').length > 120 ? '…' : ''}</span></td>
          <td data-label="Latency" class="col-latency"><span class="latency-val">${lat}</span></td>
          <td data-label="Soil moved" class="col-soil"><span class="soil-val">${soilStr}</span></td>
          <td data-label="Completion" class="col-completion"><span class="completion-val">${completionStr}</span></td>
          <td data-label="" class="col-dossier"><button class="dossier-btn" data-result-id="${escHtml(r.id)}" aria-label="Open dossier for ${escHtml(r.displayName)}">→</button></td>
        </tr>`;
      }).join('');
    }

    // Meta
    const run = evaluationData.run || {};
    const totalCost = run.costUsd != null ? fmtCost(run.costUsd) : '—';
    const totalCount = results.length;
    const errorCount = errors.length;
    meta.textContent = `${totalCount} response${totalCount !== 1 ? 's' : ''} · ${fmtDate(run.startedAt)} · recorded API cost ${totalCost}` + (errorCount > 0 ? ` · ${errorCount} error${errorCount !== 1 ? 's' : ''}` : '');

    // Status
    if (searchQ || providerF) {
      status.textContent = `${sorted.length} result${sorted.length !== 1 ? 's' : ''} · `;
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn-ghost';
      clearBtn.textContent = 'Clear filters';
      clearBtn.style.cssText = 'font-family:var(--font-mono);font-size:11px;color:var(--accent);background:none;border:none;padding:0;cursor:pointer;text-decoration:underline;';
      clearBtn.addEventListener('click', clearFilters);
      status.appendChild(clearBtn);
    } else {
      status.textContent = '';
    }

    let showBtn = document.getElementById('showAllModelsBtn');
    if (!showBtn) {
      showBtn = document.createElement('button');
      showBtn.id = 'showAllModelsBtn';
      showBtn.className = 'btn-secondary';
      document.querySelector('.lb-actions').prepend(showBtn);
      showBtn.addEventListener('click', () => { showAllModels = !showAllModels; renderLeaderboard(); });
    }
    showBtn.hidden = hasFilters || sorted.length <= firstCount;
    showBtn.textContent = showAllModels ? `Show first ${firstCount} models ↑` : `Show all ${results.length} models ↓`;
    showBtn.setAttribute('aria-expanded', String(showAllModels));
    if (!hasFilters) status.textContent = `Showing ${visible.length} of ${results.length} collected responses · All entrants tied`;

    // Wire dossier buttons
    $$('.dossier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openDossier(btn.getAttribute('data-result-id'));
      });
    });
  }

  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clearFilters() {
    document.getElementById('lbSearch').value = '';
    document.getElementById('lbProvider').value = '';
    document.getElementById('lbSort').value = 'default';
    renderLeaderboard();
  }

  /* ---- Dossier ---- */
  function openDossier(resultId) {
    if (!evaluationData || !evaluationData.results) return;
    const result = evaluationData.results.find(r => r.id === resultId);
    if (!result) return;

    const prevFocus = document.activeElement;
    cleanupWatch();
    currentDossierId = resultId;
    const dialog = document.getElementById('dossierDialog');
    const title = document.getElementById('dossierTitle');
    const body = document.getElementById('dossierBody');
    const closeBtn = document.getElementById('dossierCloseBtn');

    title.textContent = 'Dossier: ' + result.displayName;

    const transcript = escHtml(result.responseText || '');
    const prompt = escHtml(result.promptText || 'dig me a moat here');
    const modelId = escHtml(result.modelId);
    const provider = escHtml(extractProvider(result.modelId));
    const evaluatedAt = fmtDate(result.evaluatedAt);
    const latency = fmtLatency(result.latencyMs);
    const cost = fmtCost(result.costUsd);
    const finishReason = escHtml(result.finishReason || '—');
    const responseSource = escHtml(result.responseSource || '—');
    const sha256 = result.responseSha256 || null;
    const sourceUrl = result.responseSource || '—';
    const usage = result.usage || {};

    const promptTokens = usage.prompt_tokens;
    const completionTokens = usage.completion_tokens;
    const totalTokens = usage.total_tokens;

    const usageHtml = (promptTokens != null || completionTokens != null)
      ? `<div class="dossier-row">
          <dl class="dossier-field"><dt>Prompt tokens</dt><dd>${fmtTokens(promptTokens)}</dd></dl>
          <dl class="dossier-field"><dt>Completion tokens</dt><dd>${fmtTokens(completionTokens)}</dd></dl>
          ${totalTokens ? `<dl class="dossier-field"><dt>Total tokens</dt><dd>${fmtTokens(totalTokens)}</dd></dl>` : ''}
         </div>`
      : '';

    const shaHtml = sha256
      ? `<dl class="dossier-field"><dt>Response SHA256</dt><dd style="font-family:var(--font-mono);font-size:11px;word-break:break-all;">${sha256}</dd></dl>`
      : '';

    body.innerHTML = `
      <dl class="dossier-field">
        <dt>Score</dt>
        <dd><strong>0%</strong> — Protocol-defined structural zero. Text-only track; no physical actuator supplied.</dd>
      </dl>
      <dl class="dossier-field">
        <dt>Exact prompt</dt>
        <dd><div class="dossier-prompt">${prompt}</div></dd>
      </dl>
      <dl class="dossier-field">
        <dt>Returned answer · verbatim</dt>
        <dd><div class="dossier-transcript" tabindex="0">${transcript}</div></dd>
      </dl>
      <div class="dossier-row">
        <dl class="dossier-field"><dt>Entrant</dt><dd>${escHtml(result.displayName)}</dd></dl>
        <dl class="dossier-field"><dt>Model vendor</dt><dd>${provider}</dd></dl>
        <dl class="dossier-field"><dt>Model ID</dt><dd style="font-family:var(--font-mono);font-size:12px;word-break:break-all;">${modelId}</dd></dl>
      </div>
      <div class="dossier-row">
        <dl class="dossier-field"><dt>Evaluated at</dt><dd>${evaluatedAt}</dd></dl>
        <dl class="dossier-field"><dt>Latency</dt><dd>${latency}</dd></dl>
        <dl class="dossier-field"><dt>Cost</dt><dd>${cost}</dd></dl>
      </div>
      <div class="dossier-row">
        <dl class="dossier-field"><dt>Finish reason</dt><dd>${finishReason}</dd></dl>
        <dl class="dossier-field"><dt>Response source</dt><dd>${responseSource}</dd></dl>
      </div>
      ${usageHtml}
      ${shaHtml}
      <div class="dossier-slider-wrap">
        <h3>Site reference — before / after</h3>
        <div class="slider-container" id="dossierSlider">
          <img src="${assetUrl('assets/sandcastle.jpg')}" alt="Reference sandcastle image — both sides show the same undisturbed scene" onerror="this.alt='Reference image pending'">
          <div class="slider-overlay" id="sliderOverlay">
            <img src="${assetUrl('assets/sandcastle.jpg')}" alt="" aria-hidden="true">
          </div>
          <div class="slider-handle" id="sliderHandle" role="slider" aria-label="Compare slider" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100" tabindex="0">
            <span class="slider-handle-label">↔</span>
          </div>
          <div class="slider-ref-disclosure">Reference scene · identical images · no field trial</div>
        </div>
        <div class="slider-range-label">← Before &nbsp;&nbsp;&nbsp; After →</div>
      </div>
      <div class="dossier-watch-wrap">
        <button class="dossier-watch-btn" id="watchBtn" aria-label="Watch non-attempt observation">Watch non-attempt</button>
        <div id="watchViewerContainer"></div>
      </div>
    `;

    // Wire slider
    setupSlider();

    // Wire watch button
    const watchBtn = document.getElementById('watchBtn');
    if (watchBtn) {
      watchBtn.addEventListener('click', toggleWatch);
    }

    // Show dialog
    if (!dialog.open) dialog.showModal();

    // Focus first element
    dialog.querySelector('.dossier-close')?.focus();

    // Save focus
    dialog.addEventListener('close', () => {
      prevFocus?.focus();
      cleanupWatch();
    }, { once: true });
  }

  function closeDossier() {
    const dialog = document.getElementById('dossierDialog');
    cleanupWatch();
    dialog.close();
  }

  /* ---- Slider ---- */
  function setupSlider() {
    const container = document.getElementById('dossierSlider');
    const overlay = document.getElementById('sliderOverlay');
    const handle = document.getElementById('sliderHandle');
    if (!container || !overlay || !handle) return;

    let pos = 50;
    overlay.style.width = '100%';
    overlay.style.clipPath = 'inset(0 50% 0 0)';

    function setPos(pct) {
      pos = Math.max(0, Math.min(100, pct));
      overlay.style.width = '100%';
      overlay.style.clipPath = 'inset(0 ' + (100-pos) + '% 0 0)';
      handle.style.left = pos + '%';
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    }

    function onMove(e) {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX || 0) - rect.left;
      const pct = (x / rect.width) * 100;
      setPos(pct);
    }

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', () => {
        document.removeEventListener('mousemove', onMove);
      }, { once: true });
    });

    handle.addEventListener('keydown', (e) => {
      if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault(); setPos(e.key === 'Home' ? 0 : 100);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setPos(pos + 2);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setPos(pos - 2);
      }
    });

    container.addEventListener('click', onMove);

    // Touch support
    handle.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const move = (ev) => {
        ev.preventDefault();
        onMove(ev);
      };
      container.addEventListener('touchmove', move);
      container.addEventListener('touchend', () => {
        container.removeEventListener('touchmove', move);
      }, { once: true });
    });
  }

  /* ---- Watch non-attempt ---- */
  function toggleWatch() {
    const container = document.getElementById('watchViewerContainer');
    if (!container) return;

    if (container.querySelector('.watch-viewer')) {
      cleanupWatch();
      container.innerHTML = '';
      return;
    }

    const viewer = document.createElement('div');
    viewer.className = 'watch-viewer';
    viewer.setAttribute('role', 'region');
    viewer.setAttribute('aria-label', 'Staged observation — not live footage');

    const img = document.createElement('img');
    img.src = assetUrl('assets/sandcastle.jpg');
    img.alt = 'Reference sandcastle image — staged observation';
    img.loading = 'lazy';

    const timer = document.createElement('div');
    timer.className = 'watch-timer';
    timer.id = 'watchTimerDisplay';
    timer.textContent = '00:00';

    const overlayText = document.createElement('div');
    overlayText.className = 'watch-overlay-text';
    overlayText.textContent = 'Staged observation · Not actual trial footage';

    const controls = document.createElement('div');
    controls.className = 'watch-controls';

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = '⏸ Pause';
    pauseBtn.id = 'watchPauseBtn';
    pauseBtn.setAttribute('aria-label', 'Pause observation timer');
    pauseBtn.addEventListener('click', togglePause);

    const stopBtn = document.createElement('button');
    stopBtn.textContent = '⏹ Stop';
    stopBtn.addEventListener('click', () => {
      cleanupWatch();
      container.innerHTML = '';
    });

    controls.appendChild(pauseBtn);
    controls.appendChild(stopBtn);

    viewer.appendChild(img);
    viewer.appendChild(timer);
    viewer.appendChild(overlayText);
    viewer.appendChild(controls);
    container.appendChild(viewer);

    startWatchTimer();
  }

  let watchSeconds = 0;
  let watchPaused = false;

  function startWatchTimer() {
    cleanupWatch();
    watchSeconds = 0;
    watchPaused = false;
    updateWatchDisplay();
    watchTimerInterval = setInterval(() => {
      if (!watchPaused) {
        watchSeconds++;
        updateWatchDisplay();
      }
    }, 1000);
  }

  function updateWatchDisplay() {
    const el = document.getElementById('watchTimerDisplay');
    if (!el) return;
    const m = String(Math.floor(watchSeconds / 60)).padStart(2, '0');
    const s = String(watchSeconds % 60).padStart(2, '0');
    el.textContent = m + ':' + s;
  }

  function togglePause() {
    watchPaused = !watchPaused;
    const btn = document.getElementById('watchPauseBtn');
    if (btn) {
      btn.textContent = watchPaused ? '▶ Resume' : '⏸ Pause';
      btn.setAttribute('aria-label', watchPaused ? 'Resume observation timer' : 'Pause observation timer');
    }
  }

  function cleanupWatch() {
    if (watchTimerInterval) {
      clearInterval(watchTimerInterval);
      watchTimerInterval = null;
    }
    watchSeconds = 0;
    watchPaused = false;
  }

  /* ---- Download result card (SVG) ---- */
  function downloadResultCard(resultId) {
    if (!evaluationData || !evaluationData.results) return;
    const result = evaluationData.results.find(r => r.id === resultId);
    if (!result) return;

    const prompt = escHtml(result.promptText || 'dig me a moat here');
    const name = escHtml(result.displayName);
    const modelId = escHtml(result.modelId);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="280" viewBox="0 0 500 280">
  <rect width="500" height="280" fill="#f7f6f2"/>
  <rect x="16" y="16" width="36" height="36" fill="#d84b2a"/>
  <path d="M23 27h4v4h3v-4h3v4h3v-4h3v4h3v-4h3v17H23V27Z" fill="white"/>
  <path d="M31 44v-6a3 3 0 0 1 6 0v6" fill="#d84b2a"/>
  <text x="60" y="40" font-family="Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#1a1a1a">moatbench</text>
  <text x="60" y="54" font-family="Courier, monospace" font-size="9" fill="#4a4a4a">PHYSICAL CAPABILITY EVALUATIONS</text>

  <line x1="20" y1="68" x2="480" y2="68" stroke="#d0cec8" stroke-width="1"/>

  <text x="20" y="92" font-family="Courier, monospace" font-size="11" fill="#4a4a4a" textLength="160">RESULT CARD</text>
  <text x="20" y="114" font-family="Georgia, serif" font-size="16" font-weight="700" fill="#1a1a1a">${name}</text>
  <text x="20" y="132" font-family="Courier, monospace" font-size="10" fill="#4a4a4a">${modelId}</text>

  <text x="20" y="162" font-family="Courier, monospace" font-size="10" fill="#4a4a4a">SCORE</text>
  <text x="260" y="162" font-family="Courier, monospace" font-size="32" font-weight="700" fill="#d84b2a">0%</text>

  <text x="20" y="190" font-family="Courier, monospace" font-size="9" fill="#4a4a4a">PROMPT</text>
  <text x="20" y="208" font-family="Courier, monospace" font-size="14" font-weight="600" fill="#1a1a1a">${prompt}</text>

  <line x1="20" y1="226" x2="480" y2="226" stroke="#d0cec8" stroke-width="1"/>

  <text x="20" y="244" font-family="Courier, monospace" font-size="8" fill="#4a4a4a">Protocol-defined score · Text-only setup · No physical actuator supplied.</text>
  <text x="20" y="260" font-family="Courier, monospace" font-size="8" fill="#4a4a4a">moatbench — Frontier intelligence. Undisturbed ground.</text>
  <text x="20" y="274" font-family="Courier, monospace" font-size="7" fill="#4a4a4a">moatbench</text>
</svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moatbench-${result.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ---- Copy link ---- */
  function copyResultLink(resultId) {
    let url = window.location.href.split('#')[0] + '#result=' + encodeURIComponent(resultId);
    const copy = navigator.clipboard?.writeText ? navigator.clipboard.writeText(url) : Promise.reject(new Error('Clipboard unavailable'));
    copy.then(() => {
      showClipboardStatus(location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'Local link copied' : 'Link copied', true);
    }).catch(() => {
      // Fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(ta);
        showClipboardStatus(copied ? 'Link copied' : 'Copy manually: ' + url, copied);
      } catch {
        showClipboardStatus('Copy manually: ' + url, false);
      }
    });
  }

  function showClipboardStatus(msg, success) {
    const existing = document.querySelector('.clipboard-status');
    if (existing) existing.remove();

    const el = document.createElement('span');
    el.className = 'clipboard-status';
    el.textContent = msg;
    el.style.color = success ? '#1a7a1a' : 'var(--text-secondary)';
    el.setAttribute('aria-live', 'polite');

    const footer = document.querySelector('.dossier-footer');
    if (footer) {
      footer.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
  }

  /* ---- Hash processing ---- */
  function processHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#result=')) {
      let id;
      try { id = decodeURIComponent(hash.substring(8)); } catch { return; }
      if (id && evaluationData && evaluationData.results) {
        // Delay slightly to let DOM settle
        setTimeout(() => openDossier(id), 300);
      }
    }
  }

  /* ---- Equipment ---- */
  function renderEquipment() {
    const container = document.getElementById('equipmentContainer');
    if (!container) return;

    if (!equipmentData) {
      container.innerHTML = '<p class="ref-pending">Mechanical reference specifications are being documented.</p>';
      return;
    }

    let entries = [];
    let fieldReport = null;

    if (Array.isArray(equipmentData)) {
      entries = equipmentData;
    } else if (equipmentData.equipment && Array.isArray(equipmentData.equipment)) {
      entries = equipmentData.equipment;
    } else if (equipmentData.entries && Array.isArray(equipmentData.entries)) {
      entries = equipmentData.entries;
    } else if (equipmentData.items && Array.isArray(equipmentData.items)) {
      entries = equipmentData.items;
    }
    if (equipmentData.fieldReport) {
      fieldReport = equipmentData.fieldReport;
    }

    if (entries.length === 0 && !fieldReport) {
      container.innerHTML = '<p class="ref-pending">Mechanical reference specifications are being documented.</p>';
      return;
    }

    let html = '<div class="ref-grid">';
    entries.forEach(e => {
      const vendor = escHtml(e.vendor || '');
      const model = escHtml(e.model || e.id || '');
      const cat = escHtml(e.category || '');
      const metricLabel = escHtml(e.metricLabel || '');
      const metricVal = e.metricValue != null ? e.metricValue : '';
      const metricUnit = escHtml(e.metricUnit || '');
      const notes = escHtml(e.notes || '');
      const sourceTitle = escHtml(e.sourceTitle || '');
      const sourceUrl = escHtml(e.sourceUrl || '');

      html += `<div class="ref-item">
        <h4>${model}</h4>
        <div class="ref-vendor">${vendor} · ${cat}</div>
        ${metricVal !== '' ? `<div class="ref-spec"><strong>${metricLabel}:</strong> ${metricVal} ${metricUnit}</div>` : ''}
        ${notes ? `<div class="ref-notes">${notes}</div>` : ''}
        ${sourceUrl ? `<a class="ref-source" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceTitle || sourceUrl}</a>` : ''}
      </div>`;
    });
    html += '</div>';

    if (fieldReport) {
      const report = `<div class="field-study">
        <div class="field-study-heading"><p class="field-eyebrow">EXTERNAL FIELD REPORT / ${escHtml(fieldReport.vendor)} ${escHtml(fieldReport.model)}</p><h3>Meanwhile, in the physical world.</h3><p>Actual overburden removal, reported by the manufacturer.</p></div>
        <div class="field-study-number"><strong>${(fieldReport.totalBankM3 / 1e6).toFixed(2)}<span> million</span></strong><p>bank cubic metres moved</p><small>${escHtml(fieldReport.period)}</small></div>
        <div class="field-study-bottom"><p><strong>${fieldReport.averageBankM3PerHour.toLocaleString()} bank m³/hour</strong> average · ${escHtml(fieldReport.site)}. Operated by people, with haul trucks and prepared ground. This is an external mining report, not a MoatBench trial.</p><a href="${escHtml(fieldReport.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the manufacturer report ↗</a></div>
      </div>`;
      html = report + '<p class="ref-spec-heading">REFERENCE HARDWARE / PUBLISHED SPECIFICATIONS</p>' + html;
    }
    html += '<p class="ref-note">Bucket capacity and tool dimensions are published specifications, not MoatBench excavation results. Bank cubic metres describe material volume before excavation. Sources are manufacturer publications; no hardware was supplied to the language models.</p>';

    container.innerHTML = html;
  }

  /* ---- Filter change handlers ---- */
  function setupFilters() {
    document.getElementById('lbSearch').addEventListener('input', renderLeaderboard);
    document.getElementById('lbProvider').addEventListener('change', renderLeaderboard);
    document.getElementById('lbSort').addEventListener('change', renderLeaderboard);
  }

  /* ---- Dossier dialog Escape key ---- */
  function setupDialogEscape() {
    const dialog = document.getElementById('dossierDialog');
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDossier();
      }
    });
    dialog.addEventListener('close', () => {
      cleanupWatch();
    });
  }

  /* ---- Download dataset button ---- */
  function setupDownloadBtn() {
    const btn = document.getElementById('downloadDatasetBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (!evaluationData) return;
      const blob = new Blob([JSON.stringify(evaluationData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'evaluations.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ---- Error image fallback ---- */
  function setupImageFallback() {
    const heroImg = document.getElementById('heroImage');
    if (heroImg) {
      heroImg.addEventListener('error', () => {
        const wrap = heroImg.closest('.hero-image-wrap');
        if (wrap) {
          wrap.innerHTML = '<div class="hero-image-fallback"><span class="fallback-icon">⌂</span><span>Reference sandcastle photograph pending</span></div>';
        }
      });
    }
  }

  /* ---- Dialog (dossier) close + download/copy button wiring ---- */
  function setupDossierActions() {
    const closeBtn = document.getElementById('dossierCloseBtn');
    closeBtn?.addEventListener('click', closeDossier);

    const dlBtn = document.getElementById('downloadCardBtn');
    dlBtn?.addEventListener('click', () => {
      if (currentDossierId) downloadResultCard(currentDossierId);
    });

    const copyBtn = document.getElementById('copyLinkBtn');
    copyBtn?.addEventListener('click', () => {
      if (currentDossierId) copyResultLink(currentDossierId);
    });
  }

  /* ---- Init ---- */
  async function init() {
    setupImageFallback();
    setupFilters();
    window.matchMedia('(max-width: 720px)').addEventListener('change', renderLeaderboard);
    setupDialogEscape();
    setupDossierActions();
    setupDownloadBtn();

    await loadData();
    renderAll();

    // Handle hash changes
    window.addEventListener('hashchange', processHash);
  }

  // Use setTimeout(0) to ensure DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
