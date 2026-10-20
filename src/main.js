// =====================================================
// MoatBench — application
// Vanilla JS, no runtime dependencies.
// =====================================================

(function () {
  'use strict';

  const BASE_URL = (import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
  const CONFIG = Object.assign({ contactEmail: '', siteUrl: '' }, window.MOATBENCH_CONFIG || {});
  const PROMPT = 'dig me a moat here';
  const SHOVEL_RE = /\b(shovels?|spades?)\b/gi;

  const assetUrl = (p) => BASE_URL + p.replace(/^\//, '');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ---- state ---- */
  let data = null;         // evaluations.json
  let equipment = null;    // equipment.json
  let annotations = null;  // annotations.json
  let results = [];        // accepted transcripts with derived fields
  let showAll = false;
  let currentId = null;
  let watchTimer = null;
  let watchSeconds = 0;
  let watchPaused = false;

  /* ---- helpers ---- */
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  const fmtLatency = (ms) => ms == null ? '—' : ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(1) + ' s';
  const fmtCost = (usd) => usd == null ? '—' : usd < 0.001 ? '< $0.001' : '$' + usd.toFixed(4);
  const fmtTokens = (n) => n == null ? '—' : n.toLocaleString('en-GB');
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
  }
  const vendorOf = (id) => (id && id.includes('/')) ? id.split('/')[0] : 'unknown';
  const countShovels = (t) => ((t || '').match(SHOVEL_RE) || []).length;
  const catOf = (r) => (annotations && annotations.classifications[r.id]) || null;
  const catLabel = (key) => (annotations && annotations.categories[key] && annotations.categories[key].label) || '—';

  /* ---- data ---- */
  async function getJson(path, optional) {
    try {
      const res = await fetch(assetUrl(path), { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      if (!optional) console.warn('MoatBench: ' + path + ' unavailable —', err.message);
      return null;
    }
  }

  async function load() {
    const [ev, eq, an, as] = await Promise.all([
      getJson('data/evaluations.json'),
      getJson('data/equipment.json', true),
      getJson('data/annotations.json', true),
      getJson('data/assets.json', true),
    ]);
    data = ev; equipment = eq; annotations = an;
    results = ev && ev.results
      ? ev.results.filter(r => r.finishReason != null && r.responseText != null)
          .map((r, i) => ({ ...r, runIndex: i, shovels: countShovels(r.responseText), length: (r.responseText || '').length }))
      : [];
    if (as) applyPhotoCredit(as);
  }

  function applyPhotoCredit(as) {
    const asset = (as.assets || []).find(a => a.path && a.path.endsWith('sandcastle.jpg'));
    const link = $('#photoCredit');
    if (asset && link && asset.sourceUrl) {
      link.href = asset.sourceUrl;
      link.textContent = 'Photo: ' + (asset.creator || 'source');
      link.target = '_blank'; link.rel = 'noopener noreferrer';
    }
  }

  /* ---- metrics ---- */
  function renderMetrics() {
    $('#metricModels').textContent = results.length ? String(results.length) : '—';
    $('#metricBest').textContent = results.length ? '0%' : '—';
    $('#metricShovels').textContent = results.length ? String(results.reduce((a, r) => a + r.shovels, 0)) : '—';
    $('#zeroN').textContent = String(results.length);
  }

  /* ---- leaderboard ---- */
  function populateFilters() {
    const prov = $('#lbProvider');
    const vendors = Array.from(new Set(results.map(r => vendorOf(r.modelId)))).sort();
    prov.innerHTML = '<option value="">All vendors</option>' + vendors.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
    const cat = $('#lbCategory');
    if (annotations) {
      cat.innerHTML = '<option value="">All classifications</option>' +
        Object.entries(annotations.categories).map(([k, v]) => `<option value="${esc(k)}">${esc(v.label)}</option>`).join('');
    } else {
      cat.closest('.field').hidden = true;
    }
  }

  function filteredSorted() {
    const q = $('#lbSearch').value.toLowerCase().trim();
    const vendor = $('#lbProvider').value;
    const cat = $('#lbCategory').value;
    const sort = $('#lbSort').value;
    let list = results.filter(r => {
      if (vendor && vendorOf(r.modelId) !== vendor) return false;
      if (cat && catOf(r) !== cat) return false;
      if (q && !(r.displayName + ' ' + r.modelId + ' ' + r.responseText).toLowerCase().includes(q)) return false;
      return true;
    });
    if (sort === 'alpha') list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    else if (sort === 'shovels') list.sort((a, b) => b.shovels - a.shovels || a.runIndex - b.runIndex);
    else if (sort === 'length') list.sort((a, b) => b.length - a.length);
    else if (sort === 'latency') list.sort((a, b) => (a.latencyMs || 0) - (b.latencyMs || 0));
    return { list, hasFilters: Boolean(q || vendor || cat) };
  }

  function renderLeaderboard() {
    const tbody = $('#lbBody');
    const meta = $('#leaderboardMeta');
    const status = $('#filterStatus');
    const showBtn = $('#showAllBtn');

    if (!results.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="lb-empty">Dataset not available. Results appear here once evaluations are collected.</td></tr>';
      meta.textContent = ''; status.textContent = ''; showBtn.hidden = true;
      return;
    }

    const { list, hasFilters } = filteredSorted();
    const firstCount = window.matchMedia('(max-width: 720px)').matches ? 6 : 12;
    const visible = (hasFilters || showAll) ? list : list.slice(0, firstCount);

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="lb-empty">No entrants match. The moat would not have either.</td></tr>';
    } else {
      tbody.innerHTML = visible.map(r => {
        const cat = catOf(r);
        const excerpt = (r.responseText || '').replace(/\s+/g, ' ').trim();
        return `<tr>
          <td class="c-rank"><span class="rank">1=</span></td>
          <td class="c-entrant"><span class="entrant">${esc(r.displayName)}</span><span class="model-id">${esc(r.modelId)}</span></td>
          <td class="c-resp"><span class="excerpt">${esc(excerpt.slice(0, 180))}${excerpt.length > 180 ? '…' : ''}</span></td>
          <td class="c-class">${cat ? `<span class="tag" data-cat="${esc(cat)}">${esc(catLabel(cat))}</span>` : '<span class="num dim">—</span>'}</td>
          <td class="c-num" data-label="Shovels mentioned"><span class="num${r.shovels ? '' : ' dim'}">${r.shovels}</span></td>
          <td class="c-num" data-label="Soil displaced"><span class="num dim" title="Not measured">—</span></td>
          <td class="c-score"><span class="score"><span class="score-val">0%</span><span class="score-bar" aria-hidden="true"><span></span></span></span></td>
          <td class="c-go"><button class="go" type="button" data-id="${esc(r.id)}" aria-label="Open dossier for ${esc(r.displayName)}">→</button></td>
        </tr>`;
      }).join('');
    }

    const run = data.run || {};
    const errs = (data.errors || []).length;
    meta.textContent = `${results.length} accepted transcripts · run ${esc(run.id || '')} · ${fmtDate(run.startedAt)} · recorded API cost ${fmtCost(run.costUsd)}` + (errs ? ` · ${errs} collection failures, unscored` : '');

    status.innerHTML = hasFilters
      ? `${list.length} of ${results.length} entrants · all tied at 0% <button type="button" class="link-btn" id="clearFiltersBtn">Clear filters</button>`
      : `Showing ${visible.length} of ${results.length} entrants · all tied at 0%`;
    const clear = $('#clearFiltersBtn');
    if (clear) clear.addEventListener('click', clearFilters);

    showBtn.hidden = hasFilters || list.length <= firstCount;
    showBtn.textContent = showAll ? `Show first ${firstCount}` : `Show all ${results.length} entrants`;
    showBtn.setAttribute('aria-expanded', String(showAll));

    $$('.go[data-id]').forEach(b => b.addEventListener('click', () => openDossier(b.dataset.id)));
  }

  function clearFilters() {
    $('#lbSearch').value = ''; $('#lbProvider').value = ''; $('#lbCategory').value = ''; $('#lbSort').value = 'default';
    renderLeaderboard();
  }

  /* ---- figure 2: scatter ---- */
  function renderScatter() {
    const host = $('#scatterChart');
    if (!host) return;
    if (!results.length) { host.innerHTML = '<p class="muted">No data.</p>'; return; }

    const W = 760, H = 300, m = { l: 52, r: 18, t: 18, b: 46 };
    const pts = results.map(r => ({ r, x: (r.usage && r.usage.completion_tokens) || Math.max(1, Math.round(r.length / 4)) }));
    const xs = pts.map(p => p.x);
    const xmin = Math.pow(10, Math.floor(Math.log10(Math.min(...xs))));
    const xmax = Math.pow(10, Math.ceil(Math.log10(Math.max(...xs))));
    const sx = (v) => m.l + (Math.log10(v) - Math.log10(xmin)) / (Math.log10(xmax) - Math.log10(xmin)) * (W - m.l - m.r);
    const sy = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);

    const xticks = [];
    for (let e = Math.log10(xmin); e <= Math.log10(xmax); e++) { [1, 2, 5].forEach(k => { const v = k * Math.pow(10, e); if (v >= xmin && v <= xmax) xticks.push(v); }); }
    const yticks = [0, 25, 50, 75, 100];

    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Scatter plot of moat completion against completion tokens for ${results.length} entrants; every point lies on the zero line.">`;
    yticks.forEach(v => { svg += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${sy(v)}" y2="${sy(v)}"/><text class="ax-label" x="${m.l - 8}" y="${sy(v) + 4}" text-anchor="end">${v}%</text>`; });
    xticks.forEach(v => { svg += `<line class="ax" x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${H - m.b}"/><text class="ax-label" x="${sx(v)}" y="${H - m.b + 16}" text-anchor="middle">${v.toLocaleString('en-GB')}</text>`; });
    svg += `<line class="moat-line" x1="${m.l}" x2="${W - m.r}" y1="${sy(100)}" y2="${sy(100)}"/><text class="moat-label" x="${W - m.r}" y="${sy(100) - 6}" text-anchor="end">a moat (100%)</text>`;
    svg += `<line class="ax-strong" x1="${m.l}" x2="${W - m.r}" y1="${sy(0)}" y2="${sy(0)}"/>`;
    svg += `<text class="ax-title" x="${(m.l + W - m.r) / 2}" y="${H - 6}" text-anchor="middle">completion tokens (log)</text>`;
    svg += `<text class="ax-title" transform="translate(12 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">moat completion</text>`;
    pts.forEach(p => { svg += `<circle class="dot" cx="${sx(p.x).toFixed(1)}" cy="${sy(0)}" r="5.5"><title>${esc(p.r.displayName)} — ${p.x.toLocaleString('en-GB')} tokens, 0%</title></circle>`; });
    svg += '</svg>';
    host.innerHTML = svg;

    const table = $('#scatterTable');
    table.innerHTML = '<table><thead><tr><th>Entrant</th><th>Completion tokens</th><th>Completion</th></tr></thead><tbody>' +
      pts.slice().sort((a, b) => a.x - b.x).map(p => `<tr><td>${esc(p.r.displayName)}</td><td>${p.x.toLocaleString('en-GB')}</td><td>0%</td></tr>`).join('') + '</tbody></table>';
    const btn = $('#scatterTableBtn');
    btn.addEventListener('click', () => {
      const open = table.hidden; table.hidden = !open;
      btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Hide data table' : 'Show data table';
    });
  }

  /* ---- figure 3: taxonomy ---- */
  function renderTaxonomy() {
    const host = $('#taxonomyChart');
    if (!host) return;
    if (!annotations || !results.length) { host.innerHTML = '<p class="muted">Editorial classification not available.</p>'; return; }
    const counts = {};
    results.forEach(r => { const c = catOf(r); if (c) counts[c] = (counts[c] || 0) + 1; });
    const rows = Object.entries(annotations.categories).map(([k, v]) => ({ k, label: v.label, detail: v.detail, n: counts[k] || 0 })).sort((a, b) => b.n - a.n);
    const max = Math.max(...rows.map(r => r.n), 1);
    host.innerHTML = rows.map(r => `
      <div class="tx-row" data-cat="${esc(r.k)}">
        <span class="tx-label">${esc(r.label)}<span class="tx-score">0%</span></span>
        <span class="tx-n">${r.n} / ${results.length}</span>
        <span class="tx-track" role="img" aria-label="${r.n} of ${results.length}"><span class="tx-fill" style="width:${(r.n / max * 100).toFixed(1)}%"></span></span>
        <span class="tx-detail">${esc(r.detail)}</span>
      </div>`).join('');
  }

  /* ---- dossier ---- */
  function openDossier(id) {
    const r = results.find(x => x.id === id);
    if (!r) return;
    cleanupWatch();
    currentId = id;
    const dialog = $('#dossierDialog');
    const prevFocus = document.activeElement;
    const cat = catOf(r);
    const u = r.usage || {};

    $('#dossierKicker').textContent = 'Dossier · ' + vendorOf(r.modelId);
    $('#dossierTitle').textContent = r.displayName;

    const transcript = esc(r.responseText).replace(SHOVEL_RE, (m) => `<mark>${m}</mark>`);

    $('#dossierBody').innerHTML = `
      <div class="d-score">
        <span class="d-score-val">0%</span>
        <div class="d-score-meta">
          <b>Moat completion.</b> Protocol-defined structural zero: text-only track, no actuator supplied. Soil displaced: unmeasured.
          ${cat ? `<br><span class="tag" data-cat="${esc(cat)}">${esc(catLabel(cat))}</span> <span class="muted" style="font-size:12px">editorial classification</span>` : ''}
        </div>
      </div>

      <div>
        <p class="d-section-title">Exact prompt</p>
        <p class="d-prompt">${esc(r.promptText || PROMPT)}</p>
      </div>

      <div>
        <p class="d-section-title">Returned answer <em>verbatim · ${r.shovels} shovel${r.shovels === 1 ? '' : 's'} mentioned, 0 supplied</em></p>
        <div class="d-transcript" tabindex="0">${transcript}</div>
      </div>

      <dl class="d-grid">
        <div class="d-field"><dt>Model ID</dt><dd class="mono">${esc(r.modelId)}</dd></div>
        <div class="d-field"><dt>Evaluated</dt><dd>${fmtDate(r.evaluatedAt)}</dd></div>
        <div class="d-field"><dt>Latency</dt><dd class="mono">${fmtLatency(r.latencyMs)}</dd></div>
        <div class="d-field"><dt>Tokens in / out</dt><dd class="mono">${fmtTokens(u.prompt_tokens)} / ${fmtTokens(u.completion_tokens)}</dd></div>
        <div class="d-field"><dt>Recorded cost</dt><dd class="mono">${fmtCost(r.costUsd)}</dd></div>
        <div class="d-field"><dt>Finish reason</dt><dd class="mono">${esc(r.finishReason || '—')}</dd></div>
        <div class="d-field"><dt>Source</dt><dd>${esc(r.responseSource || '—')}</dd></div>
        <div class="d-field"><dt>Tools supplied</dt><dd>None</dd></div>
        ${r.responseSha256 ? `<div class="d-field" style="grid-column:1/-1"><dt>Response SHA-256</dt><dd class="mono">${esc(r.responseSha256)}</dd></div>` : ''}
      </dl>

      <div>
        <p class="d-section-title">Site reference <em>before / after</em></p>
        <div class="compare" id="compare">
          <img src="${assetUrl('assets/sandcastle.jpg')}" alt="Reference sandcastle before the attempt: flat undisturbed sand around the castle.">
          <img src="${assetUrl('assets/sandcastle.jpg')}" class="compare-after" alt="Reference sandcastle after the attempt: identical, flat undisturbed sand around the castle." id="compareAfter">
          <span class="compare-label before">Before</span>
          <span class="compare-label after">After</span>
          <span class="compare-note">Identical frames by construction · no field trial</span>
          <div class="compare-handle" id="compareHandle" role="slider" tabindex="0" aria-label="Before and after comparison" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div>
        </div>
      </div>

      <div class="watch-wrap">
        <p class="d-section-title">Observation <em>staged · not trial footage</em></p>
        <div class="watch-controls">
          <button type="button" class="btn btn-ghost" id="watchBtn" aria-expanded="false">Watch attempt</button>
        </div>
        <div id="watchHost"></div>
      </div>
    `;

    setupCompare();
    $('#watchBtn').addEventListener('click', toggleWatch);

    if (!dialog.open) dialog.showModal();
    $('#dossierCloseBtn').focus();
    dialog.addEventListener('close', () => { cleanupWatch(); if (prevFocus && prevFocus.focus) prevFocus.focus(); }, { once: true });
    if (history.replaceState) history.replaceState(null, '', '#result=' + encodeURIComponent(id));
  }

  function closeDossier() {
    const dialog = $('#dossierDialog');
    cleanupWatch();
    if (dialog.open) dialog.close();
    if (history.replaceState && location.hash.startsWith('#result=')) history.replaceState(null, '', location.pathname + location.search);
  }

  /* ---- before / after ---- */
  function setupCompare() {
    const box = $('#compare'), after = $('#compareAfter'), handle = $('#compareHandle');
    if (!box) return;
    let pos = 50;
    const set = (p) => {
      pos = Math.max(0, Math.min(100, p));
      after.style.clipPath = `inset(0 0 0 ${pos}%)`;
      handle.style.left = pos + '%';
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    };
    const fromEvent = (e) => {
      const rect = box.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      set(x / rect.width * 100);
    };
    let dragging = false;
    box.addEventListener('pointerdown', (e) => { dragging = true; box.setPointerCapture(e.pointerId); fromEvent(e); });
    box.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
    box.addEventListener('pointerup', () => { dragging = false; });
    box.addEventListener('pointercancel', () => { dragging = false; });
    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(pos - step); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(pos + step); }
      else if (e.key === 'Home') { e.preventDefault(); set(0); }
      else if (e.key === 'End') { e.preventDefault(); set(100); }
    });
    set(50);
  }

  /* ---- watch attempt ---- */
  function toggleWatch() {
    const host = $('#watchHost'), btn = $('#watchBtn');
    if (host.firstChild) { cleanupWatch(); host.innerHTML = ''; btn.textContent = 'Watch attempt'; btn.setAttribute('aria-expanded', 'false'); return; }
    host.innerHTML = `
      <div class="watch" role="region" aria-label="Staged observation of the reference site. Nothing happens.">
        <img src="${assetUrl('assets/sandcastle.jpg')}" alt="The reference sandcastle, unchanged, while a timer counts.">
        <svg class="watch-bird" viewBox="0 0 22 10" aria-hidden="true"><path d="M1 7 Q6 1 11 6 Q16 1 21 7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        <span class="watch-rec">OBS · staged</span>
        <span class="watch-timer" id="watchTimer" aria-live="off">00:00</span>
        <span class="watch-note">Staged observation of the reference scene. Not trial footage. Elapsed time is yours; the model is not present.</span>
      </div>
      <div class="watch-controls">
        <button type="button" class="btn btn-ghost" id="watchPause">Pause</button>
        <button type="button" class="btn btn-ghost" id="watchStop">Stop</button>
      </div>`;
    btn.textContent = 'Hide observation'; btn.setAttribute('aria-expanded', 'true');
    $('#watchPause').addEventListener('click', () => {
      watchPaused = !watchPaused;
      $('#watchPause').textContent = watchPaused ? 'Resume' : 'Pause';
    });
    $('#watchStop').addEventListener('click', toggleWatch);
    watchSeconds = 0; watchPaused = false;
    watchTimer = setInterval(() => {
      if (watchPaused) return;
      watchSeconds++;
      const el = $('#watchTimer');
      if (el) el.textContent = String(Math.floor(watchSeconds / 60)).padStart(2, '0') + ':' + String(watchSeconds % 60).padStart(2, '0');
    }, 1000);
  }
  function cleanupWatch() {
    if (watchTimer) clearInterval(watchTimer);
    watchTimer = null; watchSeconds = 0; watchPaused = false;
    const host = $('#watchHost'); if (host) host.innerHTML = '';
    const btn = $('#watchBtn'); if (btn) { btn.textContent = 'Watch attempt'; btn.setAttribute('aria-expanded', 'false'); }
  }

  /* ---- result card (SVG) ---- */
  function downloadCard(id) {
    const r = results.find(x => x.id === id);
    if (!r) return;
    const cat = catOf(r);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f4efe5"/>
  <rect x="48" y="48" width="1104" height="534" fill="none" stroke="#15191d" stroke-width="2"/>
  <g font-family="Georgia, 'Times New Roman', serif" fill="#15191d">
    <text x="84" y="110" font-size="30" font-weight="600">moatbench</text>
    <text x="84" y="138" font-family="Courier New, monospace" font-size="14" fill="#6b7178" letter-spacing="2">PHYSICAL CAPABILITY EVALUATIONS · RESULT CARD</text>
    <text x="84" y="236" font-size="56" font-weight="400">${esc(r.displayName)}</text>
    <text x="84" y="270" font-family="Courier New, monospace" font-size="18" fill="#3f464e">${esc(r.modelId)}</text>
    <text x="84" y="340" font-family="Courier New, monospace" font-size="14" fill="#6b7178" letter-spacing="2">PROMPT</text>
    <text x="84" y="378" font-family="Courier New, monospace" font-size="30">${esc(r.promptText || PROMPT)}</text>
    <text x="84" y="440" font-family="Courier New, monospace" font-size="14" fill="#6b7178" letter-spacing="2">CLASSIFICATION</text>
    <text x="84" y="470" font-size="22">${esc(cat ? catLabel(cat) : '—')}</text>
    <text x="84" y="540" font-family="Courier New, monospace" font-size="13" fill="#6b7178">Protocol-defined score · text-only track · no actuator supplied · soil displacement unmeasured</text>
    <text x="84" y="562" font-family="Courier New, monospace" font-size="13" fill="#6b7178">what if your moat is a literal fucking moat</text>
  </g>
  <g transform="translate(900 160) rotate(-6)">
    <rect x="-120" y="-30" width="240" height="190" rx="10" fill="none" stroke="#c7411d" stroke-width="5"/>
    <text x="0" y="0" font-family="Courier New, monospace" font-size="15" fill="#c7411d" text-anchor="middle" letter-spacing="3">MOAT COMPLETION</text>
    <text x="0" y="110" font-family="Georgia, serif" font-size="128" font-weight="600" fill="#c7411d" text-anchor="middle">0%</text>
    <text x="0" y="142" font-family="Courier New, monospace" font-size="15" fill="#c7411d" text-anchor="middle" letter-spacing="3">MOAT NOT FOUND</text>
  </g>
  <g transform="translate(860 400)">
    <line x1="0" y1="90" x2="260" y2="90" stroke="#15191d" stroke-width="2"/>
    <rect x="100" y="40" width="60" height="50" fill="#cbb079" stroke="#15191d" stroke-width="1.5"/>
    <rect x="100" y="28" width="10" height="12" fill="#cbb079" stroke="#15191d" stroke-width="1.5"/>
    <rect x="125" y="28" width="10" height="12" fill="#cbb079" stroke="#15191d" stroke-width="1.5"/>
    <rect x="150" y="28" width="10" height="12" fill="#cbb079" stroke="#15191d" stroke-width="1.5"/>
    <path d="M30 90 L45 120 L85 120 L100 90" fill="none" stroke="#15191d" stroke-width="1.5" stroke-dasharray="6 4"/>
    <path d="M160 90 L175 120 L215 120 L230 90" fill="none" stroke="#15191d" stroke-width="1.5" stroke-dasharray="6 4"/>
    <line x1="0" y1="90" x2="260" y2="90" stroke="#c7411d" stroke-width="4" stroke-linecap="round"/>
    <text x="130" y="150" font-family="Courier New, monospace" font-size="12" fill="#6b7178" text-anchor="middle">specified (dashed) · observed (solid)</text>
  </g>
</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `moatbench-${r.id}.svg`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---- copy link ---- */
  function copyLink(id) {
    const base = CONFIG.siteUrl ? CONFIG.siteUrl.replace(/\/?$/, '/') : location.href.split('#')[0];
    const url = base + '#result=' + encodeURIComponent(id);
    const local = !CONFIG.siteUrl && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const done = (ok) => setClip(ok ? (local ? 'Local preview link copied' : 'Link copied') : 'Copy manually: ' + url);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(() => done(true), () => done(false));
    else done(false);
  }
  function setClip(msg) {
    const el = $('#clipStatus');
    el.textContent = msg;
    clearTimeout(setClip.t);
    setClip.t = setTimeout(() => { el.textContent = ''; }, 4000);
  }

  /* ---- deep links ---- */
  function processHash() {
    if (!location.hash.startsWith('#result=')) return;
    let id; try { id = decodeURIComponent(location.hash.slice(8)); } catch { return; }
    if (id && results.some(r => r.id === id)) openDossier(id);
  }

  /* ---- field track nomination ---- */
  function setupNomination() {
    const btn = $('#nominateBtn'), note = $('#field-nominate');
    if (!btn) return;
    if (CONFIG.contactEmail) {
      const subject = encodeURIComponent('MoatBench field-track nomination');
      const body = encodeURIComponent('Laboratory:\nModel to be evaluated:\nTier (Lite / Pro / Frontier):\nWe acknowledge the participation fee of US$10,000 per model and that scores do not depend on payment.\n');
      btn.href = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${body}`;
      note.textContent = 'Nominations: ' + CONFIG.contactEmail;
    } else {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        note.textContent = 'Nomination correspondence address not yet published. The fee schedule above remains in force.';
      });
    }
  }

  /* ---- reference class ---- */
  function renderEquipment() {
    const host = $('#equipmentContainer');
    if (!host) return;
    if (!equipment) { host.innerHTML = '<p class="muted">Reference specifications are being documented.</p>'; return; }
    const entries = equipment.entries || equipment.equipment || equipment.items || [];
    const fr = equipment.fieldReport;
    let html = '';
    if (fr) {
      html += `<div class="ref-field">
        <div>
          <p class="kicker">External field report · ${esc(fr.vendor)} ${esc(fr.model)}</p>
          <h3>Meanwhile, in the physical world.</h3>
          <p>${fr.averageBankM3PerHour.toLocaleString('en-GB')} bank m³ per hour on average at ${esc(fr.site)}, operated by people with haul trucks and prepared ground. Manufacturer-reported figure; not a MoatBench trial. <a href="${esc(fr.sourceUrl)}" target="_blank" rel="noopener noreferrer">Manufacturer report</a></p>
        </div>
        <div class="ref-number"><strong>${(fr.totalBankM3 / 1e6).toFixed(2)}<span> million m³</span></strong><small>bank cubic metres · ${esc(fr.period)}</small></div>
      </div>`;
    }
    html += '<div class="ref-grid">' + entries.map(e => `
      <div class="ref-item">
        <span class="ref-vendor">${esc(e.vendor)} · ${esc(e.category)}</span>
        <h4>${esc(e.model || e.id)}</h4>
        ${e.metricValue != null ? `<div class="ref-spec"><strong>${esc(e.metricValue)} ${esc(e.metricUnit)}</strong>${esc(e.metricLabel)}</div>` : ''}
        ${e.notes ? `<div class="ref-notes">${esc(e.notes)}</div>` : ''}
        ${e.sourceUrl ? `<a class="ref-source" href="${esc(e.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(e.sourceTitle || 'Source')}</a>` : ''}
      </div>`).join('') + '</div>';
    html += '<p class="footnote ref-note">Bucket capacity and tool dimensions are published specifications, not MoatBench excavation results. Bank cubic metres describe material volume before excavation. No hardware was supplied to any entrant; several asked.</p>';
    host.innerHTML = html;
  }

  /* ---- wiring ---- */
  function setup() {
    ['#lbSearch', '#lbProvider', '#lbCategory', '#lbSort'].forEach(s => $(s).addEventListener($(s).tagName === 'INPUT' ? 'input' : 'change', renderLeaderboard));
    window.matchMedia('(max-width: 720px)').addEventListener('change', renderLeaderboard);
    $('#showAllBtn').addEventListener('click', () => { showAll = !showAll; renderLeaderboard(); });
    $('#downloadDatasetBtn').addEventListener('click', () => {
      if (!data) return;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'evaluations.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const dialog = $('#dossierDialog');
    $('#dossierCloseBtn').addEventListener('click', closeDossier);
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeDossier(); });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) closeDossier(); });
    $('#downloadCardBtn').addEventListener('click', () => currentId && downloadCard(currentId));
    $('#copyLinkBtn').addEventListener('click', () => currentId && copyLink(currentId));
    window.addEventListener('hashchange', processHash);
    setupNomination();
  }

  async function init() {
    setup();
    await load();
    renderMetrics();
    populateFilters();
    renderLeaderboard();
    renderScatter();
    renderTaxonomy();
    renderEquipment();
    processHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
