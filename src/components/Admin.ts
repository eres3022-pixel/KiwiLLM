import { brandMark, authAccountMarkup } from '../icons'

export const renderAdmin = () => `
  <main class="dashboard-page admin-page">
    <header class="dash-nav">
      <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
        ${brandMark}
        <span>Kiwi LLM</span>
      </a>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/models">Models</a>
        <a href="/docs">Docs</a>
        <a href="/">Home</a>
      </nav>
      <div class="dash-account">${authAccountMarkup()}</div>
    </header>

    <section class="dash-shell admin-shell">
      <div class="dash-hero">
        <div>
          <p class="section-kicker">ADMIN</p>
          <h1>Kiwi control, <em>center</em></h1>
          <p>Monitor workspaces, API keys, usage, model spend, audit events, and playground activity from one protected admin view.</p>
        </div>
        <form class="admin-login-card" id="admin-login-form">
          <span>Admin sign in</span>
          <input id="admin-email" type="email" value="kiwi@admin.in" autocomplete="username" aria-label="Admin email" />
          <input id="admin-password" type="password" placeholder="Password" autocomplete="current-password" aria-label="Admin password" />
          <button class="button button-primary" type="submit">Sign in</button>
          <p id="admin-login-message">Use the temporary admin credentials to unlock this page.</p>
        </form>
      </div>

      <section class="admin-status-panel">
        <div>
          <span>Access</span>
          <strong id="admin-access-state">Checking session</strong>
        </div>
      <p id="admin-access-note">Admin data is only loaded after the backend verifies your admin session.</p>
      </section>

      <section class="dash-stats admin-stats" aria-label="Admin statistics">
        ${['Workspaces', 'Users', 'Active keys', 'Total requests', 'Total tokens', 'Credits used', 'Credits bought', 'Revenue', 'Total draws', 'Total referrals']
          .map(
            (label) => `
              <article>
                <div>
                  <span>${label}</span>
                  <b>Live</b>
                </div>
                <strong data-admin-stat="${label}">...</strong>
                <p>Loading admin data</p>
              </article>
            `,
          )
          .join('')}
      </section>

      <section class="dash-panel admin-ping-panel" style="margin-top: 24px; margin-bottom: 24px;">
        <div class="dash-panel-head" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="margin: 0; color: #fff; font-size: 18px;">Gateway Health & Live Ping Probe</h2>
            <p style="margin: 4px 0 0 0; color: var(--text-2); font-size: 13px;">Test real-time round-trip latency to the production API gateway (Protected Admin Probe).</p>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <strong id="admin-ping-result" style="font-size: 18px; color: var(--kiwi); display: none;">-- ms</strong>
            <button type="button" class="button button-primary" id="admin-run-ping-btn">Run Admin Gateway Ping</button>
          </div>
        </div>
      </section>

      <section class="admin-grid">
        <article class="dash-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Usage by model</h2>
              <p>Last 30 days</p>
            </div>
            <span id="admin-model-count">Loading</span>
          </div>
          <div class="admin-list" id="admin-model-usage"></div>
        </article>

        <article class="dash-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Recent API keys</h2>
              <p>Newest workspace keys</p>
            </div>
            <span id="admin-key-count">Loading</span>
          </div>
          <div class="admin-list" id="admin-keys"></div>
        </article>

        <article class="dash-panel admin-code-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Create Kiwi code</h2>
              <p>Credits, expiry, and redemption limit</p>
            </div>
            <span id="admin-code-count">Locked</span>
          </div>
          <form class="admin-code-form" id="admin-code-form">
            <label>
              Code
              <input id="admin-code" type="text" placeholder="Auto-generate if empty" />
            </label>
            <label>
              Credits
              <input id="admin-code-credits" type="number" min="1" step="1" value="100" />
            </label>
            <label>
              Max users
              <input id="admin-code-max" type="number" min="1" step="1" value="1" />
            </label>
            <label>
              Expiry
              <select id="admin-code-expiry-mode">
                <option value="never">Never</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
                <option value="30d">30 days</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label class="admin-code-custom-expiry" hidden>
              Date
              <input id="admin-code-expiry-date" type="date" />
            </label>
            <label class="admin-code-custom-expiry" hidden>
              Time
              <input id="admin-code-expiry-time" type="time" value="23:59" />
            </label>
            <button class="button button-primary" type="submit">Create code</button>
            <p id="admin-code-message">Create invite, promo, or manual credit codes.</p>
          </form>
          <div class="admin-list" id="admin-codes"></div>
        </article>

        <article class="dash-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Audit events</h2>
              <p>Admin-visible security trail</p>
            </div>
            <span id="admin-audit-count">Loading</span>
          </div>
          <div class="admin-list" id="admin-audit"></div>
        </article>

        <article class="dash-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Playground runs</h2>
              <p>Latest tested prompts</p>
            </div>
            <span id="admin-run-count">Loading</span>
          </div>
          <div class="admin-list" id="admin-runs"></div>
        </article>

        <article class="dash-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Recent Prizes</h2>
              <p>Rewards spun on the wheel</p>
            </div>
            <span id="admin-prize-count">Loading</span>
          </div>
          <div class="admin-list" id="admin-prizes"></div>
        </article>

        <article class="dash-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Recent Referrals</h2>
              <p>Inviter &rarr; Invitee mapping</p>
            </div>
            <span id="admin-referral-count">Loading</span>
          </div>
          <div class="admin-list" id="admin-referrals"></div>
        </article>
        <article class="dash-panel admin-users-panel" style="margin-top: 24px;">
          <div class="dash-panel-head">
            <div>
              <h2>🎰 User Draw Manager</h2>
              <p>List all users & grant free spins directly</p>
            </div>
            <span id="admin-users-count">Loading</span>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <input id="admin-users-search" type="text" placeholder="Search by name or email..." style="flex:1;min-width:180px;padding:8px 12px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:13px;" />
            <button class="button button-primary" id="admin-users-load-btn" type="button" style="white-space:nowrap;">Load Users</button>
          </div>
          <div class="admin-list" id="admin-users-list"></div>
          <p id="admin-users-msg" style="font-size:13px;color:var(--kiwi);margin-top:8px;"></p>
        </article>
      </section>
    </section>
  </main>
`
