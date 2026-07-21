import { brandMark, authAccountMarkup } from '../icons'
import { clients, features, modelCards, aboutCards, docExamples, docFeatures, pricingPlans, footerColumns } from '../data'
import { escapeHtml } from '../helpers'

export const renderHome = () => `
  <main class="site-shell">
    <nav class="topbar" aria-label="Primary navigation">
      <a class="brand" href="/" aria-label="Kiwi LLM home">
        ${brandMark}
        <span>Kiwi LLM</span>
      </a>
      <div class="nav-links" aria-label="Product sections">
        <a href="#home">Home</a>
        <span aria-hidden="true"></span>
        <a href="#how">How</a>
        <span aria-hidden="true"></span>
        <a href="/docs">Docs</a>
        <span aria-hidden="true"></span>
        <a href="#pricing">Pricing</a>
      </div>
      <div class="nav-actions">
        ${authAccountMarkup(true)}
      </div>
    </nav>

    <section class="hero-section reveal-scope" id="home">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="announcement reveal-item">
        <span>NEW</span>
        <p>Kiwi LLM now keeps your agent stack under one clean key.</p>
      </div>

      <h1 class="reveal-item">
        A Cleaner API For
        <em>Agents</em>
        <strong>That Ship Work</strong>
      </h1>

      <p class="hero-copy reveal-item">
        Bring leading models and your private backends into one OpenAI-compatible route.
        Use it from Codex, Claude CLI, Cursor, or any client while Kiwi keeps keys, credits, and usage organized.
      </p>

      <div class="hero-actions reveal-item">
        <a class="button button-primary" href="/dashboard">Create a key <span aria-hidden="true">↗</span></a>
        <a class="button button-ghost" href="#how"><span class="play-icon" aria-hidden="true"></span> See how it works</a>
      </div>

      <section class="terminal-card reveal-item" aria-label="Kiwi LLM quickstart command">
        <div class="terminal-dots" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
        <pre><code><span>$</span> export KIWI_KEY=Kiwi_live_••••••••
<span>$</span> export KIWI_URL=https://api.kiwillm.in/v1
<b>$ kiwi ask</b> "map this repo and plan the change"</code></pre>
        <div class="terminal-status">
          <small>Latency</small>
          <strong>82ms</strong>
          <small>Models</small>
          <strong>42</strong>
        </div>
      </section>

      <section class="client-strip reveal-item" aria-label="Compatible clients">
        <p>Works where your agents already run</p>
        <div>
          ${clients.map((client) => `<span>${client}</span>`).join('')}
        </div>
      </section>
    </section>

    <section class="feature-grid reveal-scope" id="how" aria-label="Kiwi LLM features">
      ${features
        .map(
          (feature) => `
            <article class="reveal-item">
              <span>${feature.eyebrow}</span>
              <h2>${feature.title}</h2>
              <p>${feature.text}</p>
            </article>
          `,
        )
        .join('')}
    </section>

    <section class="shift-section reveal-scope" id="playground" aria-label="Why Kiwi LLM">
      <div class="shift-header reveal-item">
        <h2>
          Model access has
          <em>moved.</em>
          <strong>Has your stack?</strong>
        </h2>
        <p>
          Providers, prices, and reasoning tiers keep changing. Kiwi LLM gives your code one stable route while the model world keeps moving.
        </p>
      </div>

      <div class="model-card-grid">
        ${modelCards
          .map(
            (card) => `
              <article class="model-card reveal-item">
                <div class="model-card-top">
                  <span>${card.label}</span>
                  <b>${card.mark}</b>
                </div>
                <h3>${card.title}</h3>
                <div class="chip-row">
                  ${card.chips.map((chip) => `<small>${chip}</small>`).join('')}
                </div>
                <p>${card.text}</p>
              </article>
            `,
          )
          .join('')}
      </div>

      <p class="bridge-copy reveal-item">
        Without Kiwi LLM, every new provider becomes another hand-wired key, base URL, limit, and billing trail.
      </p>

      <p class="mission-copy reveal-item">
        <span>We're building</span> the control layer where one key reaches every model,
        teams keep a single bill, and agents move faster without budget surprises.
      </p>
    </section>

    <section class="about-section reveal-scope" aria-label="About Kiwi LLM">
      <p class="section-kicker reveal-item">ABOUT KIWI LLM</p>
      <h2 class="reveal-item">
        One key.
        <em>Every</em>
        frontier model.
      </h2>
      <div class="about-grid">
        ${aboutCards
          .map(
            (card) => `
              <article class="reveal-item">
                <h3>${card.title}</h3>
                <p>${card.text}</p>
              </article>
            `,
          )
          .join('')}
      </div>
    </section>

    <section class="docs-section reveal-scope" aria-label="Kiwi LLM documentation preview">
      <p class="section-kicker reveal-item">DOCS</p>
      <h2 class="reveal-item">
        The gateway for
        <em>every</em>
        AI client
      </h2>
      <p class="docs-intro reveal-item">
        One bearer token, two familiar endpoints, and a base URL your CLI, IDE, SDK, or internal agent can use immediately.
      </p>

      <div class="code-grid">
        ${docExamples
          .map(
            (example) => `
              <article class="code-panel reveal-item">
                <div>
                  <h3>${example.title}</h3>
                  <span>${example.note}</span>
                </div>
                <pre><code>${example.code.join('\n')}</code></pre>
              </article>
            `,
          )
          .join('')}
      </div>

      <div class="docs-feature-grid">
        ${docFeatures
          .map(
            (feature) => `
              <article class="reveal-item">
                <h3>${feature.title}</h3>
                <p>${feature.text}</p>
              </article>
            `,
          )
          .join('')}
      </div>

      <div class="endpoint-strip reveal-item">
        <div>
          <p>ENDPOINTS</p>
          <code>POST https://api.kiwillm.in/v1/chat/completions</code>
          <code>POST https://api.kiwillm.in/v1/messages</code>
          <small>Auth header: Authorization: Bearer Kiwi_••••</small>
        </div>
        <a class="button button-light" href="/dashboard">Get a key <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <section class="pricing-section reveal-scope" id="pricing" aria-label="Kiwi LLM pricing">
      <p class="pricing-pill reveal-item">PRICING</p>
      <h2 class="reveal-item">
        Choose your
        <em>plan</em>
      </h2>
      <p class="pricing-intro reveal-item">
        Add credits when you need them and unlock frontier coding models for solo builders, teams, and agent-heavy workflows.
      </p>

      <div class="pricing-grid">
        ${pricingPlans
          .map(
            (plan) => `
              <article class="price-card reveal-item ${plan.badge ? 'featured' : ''}">
                ${plan.badge ? `<span>${plan.badge}</span>` : ''}
                <h3>${plan.price}</h3>
                <p>${plan.name}</p>
                <small>${plan.credits}</small>
              </article>
            `,
          )
          .join('')}
      </div>

      <div class="included-panel reveal-item">
        <h3>Frontier models included</h3>
        <p>DeepSeek, Qwen, Kimi, GLM, Step, and SenseNova models for high-effort coding and agent sessions.</p>
        <small>Payment method: card, UPI, or USDT credits depending on workspace region.</small>
      </div>

      <div class="pricing-actions reveal-item">
        <a class="button button-primary" href="/top-up"><span aria-hidden="true">↗</span> Buy credits</a>
        <a class="button button-ghost" href="/dashboard">Claim starter credits →</a>
      </div>

      <p class="social-line reveal-item">@KIWILLM · t.me/KIWILLM</p>
    </section>

    <footer class="site-footer reveal-scope" aria-label="Kiwi LLM footer">
      <div class="footer-top reveal-item">
        <div>
          <p class="footer-kicker">Ready for liftoff</p>
          <h2>Route your next agent run through Kiwi.</h2>
        </div>
        <a class="button button-light" href="/dashboard">Get started <span aria-hidden="true">↗</span></a>
      </div>

      <div class="footer-links reveal-item">
        ${footerColumns
          .map(
            (column) => `
              <nav aria-label="${column.title}">
                <h3>${column.title}</h3>
                ${column.links.map((link) => `<a href="${link.href}">${link.label}</a>`).join('')}
              </nav>
            `,
          )
          .join('')}
      </div>

      <p class="footer-wordmark reveal-item" aria-label="Kiwi LLM">Kiwi LLM</p>

      <div class="footer-bottom reveal-item">
        <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
          ${brandMark}
          <span>Kiwi LLM</span>
        </a>
        <div>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/security">Security</a>
        </div>
        <p>© 2026 Kiwi LLM</p>
      </div>
    </footer>
  </main>
`
