export type TopUpPlan = {
  price: string
  name: string
  credits: string
  bonus?: string
}

export const renderTopUpPage = (pageHeader: string, topUpPlans: TopUpPlan[]) => `
  <main class="topup-page">
    ${pageHeader}
    <section class="content-shell">
      <div class="content-hero">
        <p class="section-kicker">CREDIT PACKS</p>
        <h1>Get Up to 16.6x Credit Value Bonus</h1>
        <p>Top up real USD to receive multiplied credit value. Spend credits seamlessly across all 20+ LLM models billed strictly per 1 Million tokens.</p>
      </div>

      <section class="topup-checkout">
        <div class="topup-grid topup-grid-large">
          ${topUpPlans
            .map(
              (plan, index) => `
                <article class="${index === 3 ? 'is-featured' : ''}">
                  <span>${plan.bonus || (index === 3 ? '16.6x Best Value' : 'Bonus Pack')}</span>
                  <h3>${plan.price} USD ➔ ${plan.credits}</h3>
                  <p>${plan.name}</p>
                  <button type="button" class="buy-topup-btn">Buy ${plan.price} Pack</button>
                </article>
              `,
            )
            .join('')}
        </div>

        <aside class="custom-topup-aside">
          <h2>Custom Amount</h2>
          <p>Need a custom credit volume? Enter any USD amount below to calculate your bonus credits instantly.</p>
          <div class="custom-calc-form">
            <label for="custom-usd-input">Enter USD Amount ($)</label>
            <input id="custom-usd-input" type="number" min="1" placeholder="e.g. 50" value="50" />
            <div class="custom-calc-result">
              <small>You will receive:</small>
              <strong id="custom-calc-output">$750.00 Credits</strong>
              <span>(15x bonus rate applied)</span>
            </div>
            <button type="button" class="button button-primary buy-topup-btn" style="width: 100%;">Top Up Custom Amount</button>
          </div>
        </aside>
      </section>

      <section class="transaction-history" style="margin-top: 4rem;">
        <div class="content-hero" style="text-align: left; margin-bottom: 2rem;">
          <p class="section-kicker">HISTORY</p>
          <h2>Wallet Transactions</h2>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody id="wallet-history-body">
              <tr><td colspan="4" class="empty-state">Loading transactions...</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <div class="auth-modal contact-modal" hidden>
      <div class="auth-backdrop" id="contact-backdrop"></div>
      <div class="auth-dialog" style="text-align: center;">
        <button type="button" class="auth-close" id="contact-close" title="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div style="margin-bottom: 24px;">
          <svg class="logo" viewBox="0 0 24 24" fill="none" style="width: 48px; height: 48px; margin: 0 auto;">
            <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.9)"></circle>
            <circle cx="12" cy="12" r="4" fill="#0c0d10"></circle>
          </svg>
        </div>
        <h2 style="font-family: var(--serif); font-size: 24px; margin-bottom: 12px; color: var(--text-0);">Top up your account</h2>
        <p style="color: var(--text-1); font-size: 15px; margin-bottom: 32px; line-height: 1.6;">Automated payments are currently being upgraded. To purchase credits instantly, please contact our admin team on Discord or Telegram.</p>
        <div style="display: flex; gap: 16px; justify-content: center;">
          <a href="https://discord.gg/RCZXtvyByj" target="_blank" class="button button-primary" style="flex: 1; padding: 12px;">Discord</a>
          <a href="https://t.me/kiwillm" target="_blank" class="button button-primary" style="flex: 1; padding: 12px; background: #2AABEE; color: #fff;">Telegram</a>
        </div>
      </div>
    </div>
  </main>
`
