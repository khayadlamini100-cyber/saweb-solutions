/* ============================================================
   SaSpark — Shared App Logic
   Helpers, persistence, navigation, rendering primitives.
   ============================================================ */

(function () {
  const { CATEGORIES, STARTUPS, FUNDERS, RECENT_CONTRIBUTIONS } = window.SASPARK || {};
  const LS_KEY = 'saspark_v1';

  /* ── Persistence layer ────────────────────────────────── */
  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : { contributions: {}, submitted: [] };
    } catch (e) {
      return { contributions: {}, submitted: [] };
    }
  }
  function saveState(state) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function recordContribution(startupId, amount, funderName, message) {
    const state = loadState();
    if (!state.contributions[startupId]) state.contributions[startupId] = [];
    state.contributions[startupId].push({
      amount, funder: funderName || 'Anonymous', msg: message || '', at: Date.now(),
    });
    saveState(state);
  }
  function addSubmittedStartup(s) {
    const state = loadState();
    state.submitted.unshift(s);
    saveState(state);
  }

  /* Compose seed + user-contributed totals and add cover URLs */
  function coverFor(slug) {
    return `https://picsum.photos/seed/saspark-${slug}/1200/600`;
  }
  function getStartups() {
    const state = loadState();
    return STARTUPS.map((s) => {
      const extra = state.contributions[s.id] || [];
      const extraTotal = extra.reduce((sum, c) => sum + c.amount, 0);
      const extraCount = extra.length;
      return {
        ...s,
        coverImg: s.coverImg || coverFor(s.slug),
        amountRaised: s.amountRaised + extraTotal,
        fundersCount: s.fundersCount + extraCount,
        extraContribs: extra,
      };
    }).concat((state.submitted || []).map((s) => ({ ...s, coverImg: s.coverImg || coverFor(s.slug) })));
  }
  function getStartupById(id) {
    return getStartups().find((s) => s.id === id || s.slug === id);
  }

  /* ── Formatting ──────────────────────────────────────── */
  function fmtZAR(n) {
    if (n == null || isNaN(n)) return 'R0';
    if (n >= 1_000_000) return 'R' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.0+$/, '') + 'M';
    if (n >= 100_000)   return 'R' + Math.round(n / 1000) + 'k';
    if (n >= 1_000)     return 'R' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return 'R' + Math.round(n).toLocaleString('en-ZA');
  }
  function fmtZARExact(n) { return 'R' + Math.round(n || 0).toLocaleString('en-ZA'); }
  function fmtNum(n) { return (n || 0).toLocaleString('en-ZA'); }
  function pct(raised, goal) {
    if (!goal) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
  }
  function catLookup(id) {
    return (CATEGORIES || []).find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
  }

  /* ── Icon library (Lucide-style line icons) ─────────── */
  const ICONS = {
    shield:      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    heart:       '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    book:        '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    activity:    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    'credit-card': '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    leaf:        '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
    briefcase:   '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    wheat:       '<path d="M3 21 18 6"/><path d="M9 8a3 3 0 0 1 0-6 3 3 0 0 1 0 6z"/><path d="M14 13a3 3 0 0 1 0-6 3 3 0 0 1 0 6z"/><path d="M19 18a3 3 0 0 1 0-6 3 3 0 0 1 0 6z"/>',
    home:        '<path d="M3 9.5 12 2l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    zap:         '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    sparkles:    '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    check:       '<polyline points="20 6 9 17 4 12"/>',
    'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    search:      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    x:           '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
    'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    'arrow-left':  '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 19"/>',
    trophy:      '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    lock:        '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    'map-pin':   '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    user:        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    calendar:    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    eye:         '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    award:       '<circle cx="12" cy="8" r="6"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    upload:      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    file:        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    'id-card':   '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><line x1="14" y1="11" x2="19" y2="11"/><line x1="14" y1="14" x2="17" y2="14"/>',
    receipt:    '<path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/>',
    folder:     '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    flame:      '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    plus:       '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    qr:         '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3M21 14v3M14 17v4M17 21h4M21 21v-4"/>',
    bank:       '<path d="M3 22h18"/><path d="M5 22V11"/><path d="M19 22V11"/><path d="M9 22v-7h6v7"/><path d="M2 11h20L12 3z"/>',
    play:       '<polygon points="5 3 19 12 5 21 5 3"/>',
    'message-circle': '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    star:       '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    info:       '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  };

  function icon(name, opts = {}) {
    const body = ICONS[name] || ICONS.sparkles;
    const size = opts.size || 18;
    const stroke = opts.stroke || 1.6;
    const cls = opts.cls || 'ico';
    return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  /* ── Navigation render ───────────────────────────────── */
  function renderNav(activePage) {
    const navHTML = `
      <nav class="site-nav">
        <div class="container">
          <a href="index.html" class="nav-logo">
            <span class="nav-logo-mark">SaSpark</span>
          </a>
          <ul class="nav-links">
            <li><a href="explore.html"     ${activePage === 'explore'     ? 'class="active"' : ''}>Explore</a></li>
            <li><a href="leaderboard.html" ${activePage === 'leaderboard' ? 'class="active"' : ''}>Leaderboard</a></li>
            <li><a href="list.html"        ${activePage === 'list'        ? 'class="active"' : ''}>List your startup</a></li>
            <li><a href="index.html#how">How it works</a></li>
          </ul>
          <div class="nav-actions">
            <a href="explore.html" class="btn btn-ghost btn-sm">Fund a startup</a>
            <a href="list.html"    class="btn btn-primary btn-sm">Start a campaign</a>
            <div class="hamburger" id="hamburger"><span></span><span></span><span></span></div>
          </div>
        </div>
      </nav>
    `;
    const navMount = document.getElementById('nav');
    if (navMount) navMount.outerHTML = navHTML;

    requestAnimationFrame(() => {
      const ham = document.getElementById('hamburger');
      const links = document.querySelector('.nav-links');
      if (ham && links) {
        ham.addEventListener('click', () => {
          ham.classList.toggle('open');
          links.classList.toggle('open');
        });
      }
    });
  }

  /* ── Footer ──────────────────────────────────────────── */
  function renderFooter() {
    const html = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="footer-brand-name">SaSpark</div>
              <p style="font-size: 0.9rem; max-width: 320px; line-height: 1.6;">
                South Africa's crowdfunding platform for groundbreaking startups that solve real problems.
                Fund from R1. Build the future.
              </p>
            </div>
            <div>
              <h4>Platform</h4>
              <ul>
                <li><a href="explore.html">Explore startups</a></li>
                <li><a href="leaderboard.html">Leaderboard</a></li>
                <li><a href="list.html">List your startup</a></li>
                <li><a href="index.html#how">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4>Trust &amp; safety</h4>
              <ul>
                <li><a href="#">Verification process</a></li>
                <li><a href="#">Payment security</a></li>
                <li><a href="#">POPIA &amp; privacy</a></li>
                <li><a href="#">Report a concern</a></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="#">About us</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Partner with us</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© 2026 SaSpark by SaWeb Solutions. All rights reserved.</span>
            <span>Made in South Africa</span>
          </div>
        </div>
      </footer>
    `;
    const m = document.getElementById('footer');
    if (m) m.outerHTML = html;
  }

  /* ── Startup card ────────────────────────────────────── */
  function startupCardHTML(s) {
    const cat = catLookup(s.category);
    const progress = pct(s.amountRaised, s.fundingGoal);
    return `
      <a href="startup.html?id=${s.id}" class="startup-card">
        <div class="startup-cover">
          <img src="${s.coverImg}" alt="${escapeHtml(s.name)}" loading="lazy"/>
          <span class="cat-tag">${icon(cat.iconName, { size: 14 })}${cat.name}</span>
          ${s.verified ? `<span class="verified-badge" title="Verified">${icon('check', { size: 14, stroke: 2.4 })}</span>` : ''}
        </div>
        <div class="startup-body">
          <div class="startup-name">${escapeHtml(s.name)}</div>
          <div class="startup-tagline">${escapeHtml(s.tagline)}</div>
          <div class="fund-bar"><div class="fund-bar-fill" style="width: ${progress}%"></div></div>
          <div class="fund-meta">
            <span><strong>${fmtZAR(s.amountRaised)}</strong> raised</span>
            <span>${progress}% of ${fmtZAR(s.fundingGoal)}</span>
          </div>
        </div>
        <div class="card-footer">
          <span>${icon('user', { size: 13 })} ${fmtNum(s.fundersCount)} backers</span>
          <span>${s.trending > 85 ? `<span class="trend-pill">${icon('flame', { size: 11, stroke: 2 })} Trending</span>` : ''} ${icon('calendar', { size: 13 })} ${s.daysLeft}d left</span>
        </div>
      </a>
    `;
  }

  /* ── Toast ─────────────────────────────────────────── */
  let toastTimer = null;
  function toast(msg, kind = '') {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.className = 'toast ' + kind;
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('show'));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function qs(name) { return new URLSearchParams(location.search).get(name); }
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function trendingScore(s) {
    return (s.trending || 0) * 100 + (s.fundersCount || 0) * 0.5 + (s.amountRaised || 0) / 10000;
  }

  window.app = {
    CATEGORIES, STARTUPS, FUNDERS, RECENT_CONTRIBUTIONS,
    getStartups, getStartupById,
    recordContribution, addSubmittedStartup,
    fmtZAR, fmtZARExact, fmtNum, pct, catLookup,
    renderNav, renderFooter, startupCardHTML,
    icon,
    toast, qs, escapeHtml, trendingScore,
    coverFor,
  };
})();
