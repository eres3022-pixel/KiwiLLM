export type TopUpPlan = {
  price: string
  name: string
  credits: string
}

export const renderTopUpPage = (pageHeader: string, topUpPlans: TopUpPlan[]) => `
  <main class="topup-page">
    ${pageHeader}
    <section class="content-shell">
      <div class="content-hero">
        <p class="section-kicker">CREDITS</p>
        <h1>Top up one Kiwi balance for every model route.</h1>
        <p>Add credits to your workspace, then spend them across text, code, image, and video models without juggling provider balances.</p>
      </div>

      <section class="topup-checkout">
        <div class="topup-grid topup-grid-large">
          ${topUpPlans
            .map(
              (plan, index) => `
                <article class="${index === 3 ? 'is-featured' : ''}">
                  <span>${index === 3 ? 'Best value' : 'Workspace pack'}</span>
                  <h3>${plan.price} · ${plan.name}</h3>
                  <p>${plan.credits}</p>
                  <a href="/dashboard">Open dashboard checkout</a>
                </article>
              `,
            )
            .join('')}
        </div>
        <aside>
          <h2>Payment setup</h2>
          <p>Connect your production payment provider before launch. This page is wired for users to choose a pack and continue from the dashboard checkout surface.</p>
          <div>
            <b>Supported methods</b>
            <span>Card, UPI, and USDT can be enabled by region.</span>
          </div>
          <div>
            <b>After payment</b>
            <span>Credits should be added through a signed backend confirmation, not client-only state.</span>
          </div>
          <a class="button button-primary" href="/dashboard">Go to dashboard</a>
        </aside>
      </section>
    </section>
  </main>
`
