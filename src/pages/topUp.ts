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
                  <a href="/dashboard">Buy ${plan.price} Pack</a>
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
            <a class="button button-primary" href="/dashboard">Top Up Custom Amount</a>
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
  </main>
`
