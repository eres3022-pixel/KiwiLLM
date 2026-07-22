import { brandMark, authAccountMarkup } from '../icons'
import { pageLinks } from '../data'
import { pageHeader } from '../helpers'

export const renderUsageLogs = () => `
  <main class="dashboard-page">
    ${pageHeader(brandMark, pageLinks, authAccountMarkup)}

    <section class="dash-shell">
      <div class="dash-hero">
        <div>
          <p class="section-kicker">USAGE LOGS</p>
          <h1>Request <em>History</em></h1>
          <p>Every API call through your Kiwi workspace — model, tokens, cost, and status.</p>
        </div>
        <div class="usage-summary-cards" id="usage-summary-cards">
          <div class="usage-summary-card">
            <span>Total Requests</span>
            <strong id="usage-total-requests">—</strong>
          </div>
          <div class="usage-summary-card">
            <span>Total Tokens</span>
            <strong id="usage-total-tokens">—</strong>
          </div>
          <div class="usage-summary-card">
            <span>Total Cost</span>
            <strong id="usage-total-cost">—</strong>
          </div>
        </div>
      </div>

      <article class="usage-logs-panel">
        <!-- Controls row -->
        <div class="usage-controls">
          <div class="usage-filters">
            <input id="usage-filter-model" class="key-filter-input" type="text" placeholder="Filter by model…" aria-label="Filter by model" />
            <select id="usage-filter-status" class="usage-select" aria-label="Filter by status">
              <option value="">All statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            <select id="usage-filter-period" class="usage-select" aria-label="Filter by period">
              <option value="7">Last 7 days</option>
              <option value="30" selected>Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <button class="usage-refresh-btn" id="usage-refresh-btn" type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        <!-- Table -->
        <div class="usage-table-wrapper">
          <table class="usage-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Model</th>
                <th>API Key</th>
                <th>Prompt Tokens</th>
                <th>Completion Tokens</th>
                <th>Total Tokens</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody id="usage-logs-body">
              <tr><td colspan="9" class="empty-state">Loading usage logs…</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="usage-pagination" id="usage-pagination"></div>
      </article>
    </section>
  </main>
`
