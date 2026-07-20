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
        <a href="/playground">Playground</a>
        <a href="/docs">Docs</a>
        <a href="/">Home</a>
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
        <div class="dash-hero-card">
          <span>Workspace health</span>
          <strong id="workspace-health">...</strong>
          <small id="workspace-health-note">Loading backend status</small>
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

      <section class="dash-grid lower">
        <article class="dash-panel">
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

        <article class="dash-panel dash-keys">
          <div class="dash-panel-head">
            <div>
              <h2>API keys</h2>
              <p>Scoped keys for teams and clients.</p>
            </div>
            <a href="#create-api-key">New key</a>
          </div>
          <p class="empty-state">Loading keys from backend...</p>
        </article>
      </section>

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

      <section class="key-builder-panel" id="create-api-key">
        <div class="dash-panel-head">
          <div>
            <h2>Create an API key</h2>
            <p>Name the key and use it with any live Kiwi model route.</p>
          </div>
          <span>Free plan</span>
        </div>
        <div class="key-builder-form">
          <input id="key-name" type="text" placeholder="Key name, e.g. codex-production" aria-label="Key name" />
          <select id="key-mode" aria-label="Model routing mode">
            <option>Any model the client chooses</option>
          </select>
        </div>
        <div class="key-builder-footer">
          <button id="create-key-button" class="button button-light" type="button">Create key</button>
          <p id="create-key-message">New free keys can call any live model at 10 RPM (credit-based, no daily limits).</p>
        </div>
      </section>
    </section>
  </main>
`
