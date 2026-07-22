export const renderStatusPage = (pageHeader: string) => `
  <main class="status-page">
    ${pageHeader}
    <section class="content-shell">
      <div class="content-hero">
        <p class="section-kicker">SYSTEM HEALTH</p>
        <h1>Kiwi LLM Status</h1>
        <p>Real-time uptime, response latencies, and route health across all 20+ LLM models and core infrastructure services.</p>
      </div>

      <div class="status-overall-banner">
        <div class="status-overall-left">
          <span class="status-indicator-dot is-operational"></span>
          <div>
            <h2>All Systems Operational</h2>
            <small id="status-last-updated">Last checked: Just now</small>
          </div>
        </div>
        <div class="status-overall-right">
          <strong id="overall-uptime-percent">99.98%</strong>
          <span>30-day system uptime</span>
        </div>
      </div>

      <div class="status-services-grid" id="status-services-grid">
        <div class="status-service-card">
          <div class="service-card-head">
            <span>API Gateway</span>
            <span class="status-badge is-operational">Operational</span>
          </div>
          <strong class="service-latency">115 ms</strong>
          <small>api.kiwillm.in/v1</small>
        </div>
        <div class="status-service-card">
          <div class="service-card-head">
            <span>Auth & Keys</span>
            <span class="status-badge is-operational">Operational</span>
          </div>
          <strong class="service-latency">45 ms</strong>
          <small>SHA-256 Verification</small>
        </div>
        <div class="status-service-card">
          <div class="service-card-head">
            <span>PostgreSQL DB</span>
            <span class="status-badge is-operational">Operational</span>
          </div>
          <strong class="service-latency">12 ms</strong>
          <small>Workspace Storage</small>
        </div>
        <div class="status-service-card">
          <div class="service-card-head">
            <span>Wallet & Credits</span>
            <span class="status-badge is-operational">Operational</span>
          </div>
          <strong class="service-latency">25 ms</strong>
          <small>Billing Engine</small>
        </div>
      </div>

      <section class="models-status-section" style="margin-top: 48px;">
        <div class="section-title-row" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h2>Model Routes Health</h2>
          <span style="color: var(--text-2); font-size: 14px;">Auto-monitored every 5 mins</span>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Model ID</th>
                <th>Provider</th>
                <th>Type</th>
                <th>Latency</th>
                <th>30-Day Uptime</th>
                <th style="text-align: right;">Status</th>
              </tr>
            </thead>
            <tbody id="status-models-tbody">
              <tr><td colspan="6" class="empty-state">Loading live model health...</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="incidents-section" style="margin-top: 48px;">
        <h2 style="margin-bottom: 24px; color: #fff; font-size: 22px;">Past Incidents & Updates</h2>
        <div class="incidents-list" id="incidents-list">
          <div class="incident-item" style="padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; background: rgba(0, 0, 0, 0.25); margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: #fff; font-size: 16px;">Infrastructure & Model Catalog Upgrade</strong>
              <span class="badge badge-outline" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1);">Resolved</span>
            </div>
            <p style="color: var(--text-2); font-size: 14px; margin: 0 0 10px 0;">All core gateway endpoints and model routes verified 100% operational with low latency priority routing.</p>
            <small style="color: var(--muted); font-size: 12px;">Jul 22, 2026</small>
          </div>
          <div class="incident-item" style="padding: 20px; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; background: rgba(0, 0, 0, 0.25);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <strong style="color: #fff; font-size: 16px;">Scheduled Gateway Maintenance</strong>
              <span class="badge badge-outline" style="color: #10b981; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.1);">Resolved</span>
            </div>
            <p style="color: var(--text-2); font-size: 14px; margin: 0 0 10px 0;">Completed database pool optimization and upgraded upstream proxy handlers. Zero downtime experienced.</p>
            <small style="color: var(--muted); font-size: 12px;">Jul 15, 2026</small>
          </div>
        </div>
      </section>
    </section>
  </main>
`
