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

      <section class="topup-features" style="margin-top: 4rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px;">
        <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(0,0,0,0.3);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--kiwi)" stroke-width="2" style="margin-bottom: 16px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <h3 style="color: #fff; font-size: 16px; margin-bottom: 8px;">Never Expires</h3>
          <p style="color: var(--text-2); font-size: 14px; line-height: 1.5;">Your purchased credits remain in your wallet forever. No monthly resets, no expiration dates.</p>
        </div>
        <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(0,0,0,0.3);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--kiwi)" stroke-width="2" style="margin-bottom: 16px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          <h3 style="color: #fff; font-size: 16px; margin-bottom: 8px;">Priority Routing</h3>
          <p style="color: var(--text-2); font-size: 14px; line-height: 1.5;">Paid workspaces bypass rate limits and queue times during high-traffic periods.</p>
        </div>
        <div style="padding: 24px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(0,0,0,0.3);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--kiwi)" stroke-width="2" style="margin-bottom: 16px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <h3 style="color: #fff; font-size: 16px; margin-bottom: 8px;">Enterprise SLA</h3>
          <p style="color: var(--text-2); font-size: 14px; line-height: 1.5;">99.9% guaranteed uptime for production APIs with direct access to engineer support.</p>
        </div>
      </section>

      <section class="transaction-history" style="margin-top: 5rem;">
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

    <div class="auth-modal contact-modal" id="contact-modal" hidden>
      <div class="auth-backdrop" id="contact-backdrop"></div>
      <div class="auth-dialog" style="text-align: center;">
        <button type="button" class="auth-close" id="contact-close" title="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <div style="margin-bottom: 20px;">
          <div style="width: 56px; height: 56px; margin: 0 auto; background: rgba(202, 255, 31, 0.12); border: 1px solid rgba(202, 255, 31, 0.3); border-radius: 50%; display: grid; place-items: center;">
            <svg viewBox="0 0 24 24" fill="none" style="width: 32px; height: 32px;">
              <circle cx="12" cy="12" r="10" fill="var(--kiwi)"></circle>
              <circle cx="12" cy="12" r="4" fill="#0c0d10"></circle>
            </svg>
          </div>
        </div>
        <h2 style="font-family: var(--serif); font-size: 24px; margin-bottom: 10px; color: #fff;">Top up your account</h2>
        <p style="color: var(--text-1); font-size: 14.5px; margin-bottom: 28px; line-height: 1.6;">Automated gateway payments are currently undergoing maintenance. To add credits to your account instantly, contact our admin team via Discord or Telegram below:</p>
        <div style="display: flex; gap: 14px; justify-content: center;">
          <a href="https://discord.gg/RCZXtvyByj" target="_blank" rel="noopener noreferrer" class="button button-primary" style="flex: 1; padding: 12px; font-weight: 700;">Discord</a>
          <a href="https://t.me/kiwillmofficial" target="_blank" rel="noopener noreferrer" class="button button-primary" style="flex: 1; padding: 12px; background: #2AABEE; color: #fff; border-color: #2AABEE; font-weight: 700;">Telegram</a>
        </div>
      </div>
    </div>
  </main>
`
