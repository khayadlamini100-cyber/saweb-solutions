/* ============================================================
   SaSpark — Shared App Logic
   Helpers, persistence, navigation, rendering primitives.
   ============================================================ */

(function () {
  const { CATEGORIES, STARTUPS, FUNDERS, RECENT_CONTRIBUTIONS } = window.SASPARK || {};
  const LS_KEY = 'saspark_v1';

  /* ── Persistence layer (overlays user actions onto seed data) ── */
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
      amount,
      funder: funderName || 'Anonymous',
      msg: message || '',
      at: Date.now(),
    });
    saveState(state);
  }
  function addSubmittedStartup(s) {
    const state = loadState();
    state.submitted.unshift(s);
    saveState(state);
  }

  /* Compose seed + user-contributed totals */
  function getStartups() {
    const state = loadState();
    return STARTUPS.map((s) => {
      const extra = state.contributions[s.id] || [];
      const extraTotal = extra.reduce((sum, c) => sum + c.amount, 0);
      const extraCount = extra.length;
      return {
        ...s,
        amountRaised: s.amountRaised + extraTotal,
        fundersCount: s.fundersCount + extraCount,
        extraContribs: extra,
      };
    }).concat(state.submitted || []);
  }
  function getStartupById(id) {
    return getStartups().find((s) => s.id === id || s.slug === id);
  }

  /* ── Formatting ──────────────────────────────────────────── */
  function fmtZAR(n) {
    if (n == null || isNaN(n)) return 'R0';
    if (n >= 1_000_000) return 'R' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.0+$/, '') + 'M';
    if (n >= 100_000)   return 'R' + Math.round(n / 1000) + 'k';
    if (n >= 1_000)     return 'R' + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return 'R' + Math.round(n).toLocaleString('en-ZA');
  }
  function fmtZARExact(n) {
    return 'R' + Math.round(n || 0).toLocaleString('en-ZA');
  }
  function fmtNum(n) {
    return (n || 0).toLocaleString('en-ZA');
  }
  function pct(raised, goal) {
    if (!goal) return 0;
    return Math.min(100, Math.round((raised / goal) * 100));
  }
  function catLookup(id) {
    return (CATEGORIES || []).find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
  }

  /* ── Navigation render ───────────────────────────────────── */
  function renderNav(activePage) {
    const navHTML = `
      <nav class="site-nav">
        <div class="container">
          <a href="index.html" class="nav-logo">
            <div class="nav-logo-mark">S</div>
            <span>SaSpark</span>
          </a>
          <ul class="nav-links">
            <li><a href="explore.html"     ${activePage === 'explore'     ? 'class="active"' : ''}>Explore</a></li>
            <li><a href="leaderboard.html" ${activePage === 'leaderboard' ? 'class="active"' : ''}>Leaderboard</a></li>
            <li><a href="list.html"        ${activePage === 'list'        ? 'class="active"' : ''}>List your startup</a></li>
            <li><a href="index.html#how"   >How it works</a></li>
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

  /* ── Footer ───────────────────────────────────────────────── */
  function renderFooter() {
    const html = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="footer-brand-name">
                <div class="nav-logo-mark">S</div>
                SaSpark
              </div>
              <p style="font-size: 0.9rem; max-width: 320px;">
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
            <span>Made with 💜 in South Africa</span>
          </div>
        </div>
      </footer>
    `;
    const m = document.getElementById('footer');
    if (m) m.outerHTML = html;
  }

  /* ── Startup card ────────────────────────────────────────── */
  function startupCardHTML(s) {
    const cat = catLookup(s.category);
    const progress = pct(s.amountRaised, s.fundingGoal);
    const trendingTag = s.trending > 85 ? `<span class="trend-pill">🔥 Trending</span>` : '';
    return `
      <a href="startup.html?id=${s.id}" class="startup-card">
        <div class="startup-cover cat-${cat.color}">
          <span class="cat-tag">${cat.icon} ${cat.name}</span>
          ${s.verified ? '<span class="verified-badge" title="Verified">✓</span>' : ''}
          <div class="startup-cover-emoji">${s.emoji || cat.icon}</div>
        </div>
        <div class="startup-body">
          <div class="startup-name">${s.name}</div>
          <div class="startup-tagline">${s.tagline}</div>
          <div class="fund-bar"><div class="fund-bar-fill" style="width: ${progress}%"></div></div>
          <div class="fund-meta">
            <span><strong class="raised">${fmtZAR(s.amountRaised)}</strong> raised</span>
            <span>${progress}% of ${fmtZAR(s.fundingGoal)}</span>
          </div>
        </div>
        <div class="card-footer">
          <span>${fmtNum(s.fundersCount)} funders</span>
          <span>${trendingTag} ${s.daysLeft} days left</span>
        </div>
      </a>
    `;
  }

  /* ── Toast ───────────────────────────────────────────────── */
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

  /* ── Helpers ─────────────────────────────────────────────── */
  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }
  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  /* ── Trending score (recent activity weighted) ───────────── */
  function trendingScore(s) {
    return (s.trending || 0) * 100 + (s.fundersCount || 0) * 0.5 + (s.amountRaised || 0) / 10000;
  }

  /* ── Expose ──────────────────────────────────────────────── */
  window.app = {
    CATEGORIES, STARTUPS, FUNDERS, RECENT_CONTRIBUTIONS,
    getStartups, getStartupById,
    recordContribution, addSubmittedStartup,
    fmtZAR, fmtZARExact, fmtNum, pct, catLookup,
    renderNav, renderFooter,
    startupCardHTML,
    toast, qs, escapeHtml,
    trendingScore,
  };
})();
