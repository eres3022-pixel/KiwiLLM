import { brandMark, authAccountMarkup } from '../icons'
import { dashboardPlaceholders, topUpPlans } from '../data'
import { dashboardGreeting, barChart } from '../helpers'

export const renderDashboard = () => `
  <main class="dashboard-page">
    <header class="dash-nav">
      <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
        ${brandMark}
        <span>Kiwi LLM</span>
      </a>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/usage">Usage</a>
        <a href="/models">Models</a>
        <a href="/playground">Playground</a>
        <a href="/docs">Docs</a>
        <a href="/top-up">Wallet</a>
      </nav>
      <div class="dash-account">${authAccountMarkup()}</div>
    </header>

    <section class="dash-shell">
      <div class="dash-hero">
        <div>
          <p class="section-kicker">DASHBOARD</p>
          <h1><span id="dashboard-greeting">${dashboardGreeting()}</span>, <em id="dashboard-name">builder</em></h1>
          <p>Your Kiwi workspace is healthy. Agents are routing through one key, budgets are calm, and model usage is easy to read.</p>
        </div>
        <div class="dash-hero-right">
          <div class="dash-hero-card">
            <span>Workspace health</span>
            <strong id="workspace-health">...</strong>
            <small id="workspace-health-note">Loading backend status</small>
          </div>
          <a href="#" class="dash-invite-card">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17l2 2v2h14v-2l-3-3"/><path d="M14 11V7a2 2 0 0 0-4 0v4"/><circle cx="12" cy="7" r="2"/></svg>
            <div>
              <strong>Invite to Earn</strong>
              <small>Up to 1-year Kiwi Credits</small>
            </div>
            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
      </div>

      <section class="dash-stats" aria-label="Usage summary">
        ${dashboardPlaceholders
          .map(
            (label) => `
              <article>
                <div>
                  <span>${label}</span>
                  <b>...</b>
                </div>
                <strong>Loading</strong>
                <p>Fetching backend data</p>
              </article>
            `,
          )
          .join('')}
      </section>

      <section class="dash-grid">
        <article class="dash-panel dash-wide">
          <div class="dash-panel-head">
            <div>
              <h2>Tokens per day</h2>
              <p>Daily token volume across all active keys.</p>
            </div>
            <span id="token-total">Loading</span>
          </div>
          ${barChart([8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], 'Tokens per day')}
        </article>

        <article class="dash-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Requests</h2>
              <p>Last 12 days</p>
            </div>
            <span id="request-total">Loading</span>
          </div>
          ${barChart([8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8], 'Requests per day')}
        </article>
      </section>

      <article class="dash-panel dash-wide" style="margin-top: 24px;">
        <div class="dash-panel-head">
          <div>
            <h2>Spend by model</h2>
            <p>Last 30 days</p>
          </div>
          <span id="spend-total">Loading</span>
        </div>
        <div class="model-spend-list">
          <p class="empty-state">Loading spend from backend...</p>
        </div>
      </article>

      <article class="dash-panel dash-keys dash-wide" id="api-keys-section" style="margin-top: 24px;">
        <!-- Header row -->
        <div class="api-keys-header">
          <div>
            <h2>API Keys</h2>
            <p>Manage, monitor, and revoke your workspace API keys.</p>
          </div>
          <span class="dash-panel-head-tag">Free plan</span>
        </div>

        <!-- Create form -->
        <div class="key-create-form-row">
          <input id="key-name" type="text" placeholder="Key name, e.g. codex-production" aria-label="Key name" />
          <button id="create-key-button" class="button button-kiwi" type="button">+ Create key</button>
        </div>

        <!-- Filter + table -->
        <div class="key-table-topbar">
          <div class="key-table-filters">
            <input id="key-filter-name" class="key-filter-input" type="text" placeholder="Filter by name…" aria-label="Filter keys by name" />
            <input id="key-filter-key" class="key-filter-input" type="text" placeholder="Filter by API key…" aria-label="Filter keys by key" />
          </div>
        </div>
        <div class="key-table-wrapper">
          <table class="key-table">
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Status</th>
                <th>API Key</th>
                <th>Quota</th>
                <th>Group</th>
                <th>Models</th>
                <th>IP Restriction</th>
                <th>Created</th>
                <th>Last Used</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="key-table-body">
              <tr><td colspan="12" class="empty-state">Loading API keys from backend...</td></tr>
            </tbody>
          </table>
        </div>
      </article>


      <section class="dash-actions">
        <article>
          <span>QUICK START</span>
          <h2>Send a test request</h2>
          <pre><code>curl https://api.kiwillm.in/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -d '{"model":"llama-3.2-1b","messages":[{"role":"user","content":"hi"}]}'</code></pre>
        </article>
        <article>
          <span>NEXT STEP</span>
          <h2>Invite your team</h2>
          <p>Create scoped keys, assign credit limits, and let teammates use the same model routes without sharing secrets.</p>
          <a class="button button-primary" href="/docs">Open docs</a>
        </article>
      </section>

      <section class="redeem-panel">
        <h2>Redeem a Kiwi code</h2>
        <div>
          <input id="redeem-code" type="text" placeholder="KIWI-XXXX-XXXX-XXXX" aria-label="Kiwi redemption code" />
          <button id="redeem-button" type="button">Redeem</button>
        </div>
        <p id="redeem-message">Got a team invite, event pass, or starter code? Apply it here and credits land instantly.</p>
      </section>

      <section class="topup-panel">
        <div class="dash-panel-head">
          <div>
            <h2>Credit Packs & Top Up</h2>
            <p>Top up real USD to get up to 16.6x credit value bonus. Billed per 1M tokens.</p>
          </div>
          <span>Instant workspace credit updates</span>
        </div>
        <div class="topup-grid">
          ${topUpPlans
            .map(
              (plan) => `
                <article>
                  <span class="badge-mint">${plan.bonus || 'Bonus Pack'}</span>
                  <h3>${plan.price} USD ➔ ${plan.credits}</h3>
                  <p>${plan.name}</p>
                  <a href="/top-up">Top Up Pack →</a>
                </article>
              `,
            )
            .join('')}
        </div>
        <div class="topup-included">
          <h3>Custom Credit Amount</h3>
          <p>Top up custom amounts from $1 to $5,000 with automatic high-volume credit multipliers applied instantly.</p>
        </div>
        <small>Payment methods supported: Card, UPI, and Crypto (USDT). Balance updates upon confirmation.</small>
      </section>



      <section class="community-banner">
        <div class="community-content">
          <span class="community-badge">🎁 FREE CREDITS & COMMUNITY SUPPORT</span>
          <h2>Join our Official KiwiLLM Community!</h2>
          <p>Get instant 24/7 developer support, free bonus credit drops, and feature updates.</p>
        </div>
        <div class="community-buttons">
          <a href="https://t.me/kiwillm" target="_blank" rel="noopener noreferrer" class="community-btn community-btn-telegram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .54-1.42.53-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.24-3.54 3.92-1.63 4.73-1.92 5.26-1.93.12 0 .37.03.54.17.14.12.18.28.2.45-.02.07-.02.16-.04.25z"/></svg>
            Telegram
          </a>
          <a href="https://discord.gg/RCZXtvyByj" target="_blank" rel="noopener noreferrer" class="community-btn community-btn-discord">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            Discord
          </a>
        </div>
      </section>
    </section>
  </main>
`
