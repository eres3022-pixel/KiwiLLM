import { brandMark, authAccountMarkup } from '../icons'
import { modelFilters } from '../data'

export const renderModels = () => `
  <main class="models-page">
    <header class="dash-nav">
      <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
        ${brandMark}
        <span>Kiwi LLM</span>
      </a>
      <nav>
        <a class="nav-spin-badge" href="/invite">🎁 Spin & Earn ($1000 Prize)</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/models">Models</a>
        <a href="/docs">Docs</a>
        <a href="/">Home</a>
      </nav>
      ${authAccountMarkup(true)}
    </header>

    <section class="models-shell">
      <div class="models-hero">
        <p class="section-kicker">MODEL ROUTES</p>
        <h1>Every model your agents can call.</h1>
        <p>Browse Kiwi LLM routes by modality, provider, context, and credit cost. Use these ids from any OpenAI-compatible or Anthropic-compatible client.</p>
      </div>

      <div class="model-filter-row" aria-label="Model filters">
        ${modelFilters.map((filter, index) => `<button class="${index === 0 ? 'active' : ''}" type="button">${filter}</button>`).join('')}
      </div>

      <section class="model-summary-grid">
        <article><span>Live routes</span><strong id="model-total">...</strong><p>Loaded from the active gateway</p></article>
        <article><span>Text and code</span><strong id="model-text-code">...</strong><p>Chat, coding, and reasoning routes</p></article>
        <article><span>Media routes</span><strong id="model-media">...</strong><p>Image and video generation routes</p></article>
      </section>

      <section class="model-table-card">
        <div class="model-table-head">
          <div>
            <h2>Available models</h2>
            <p id="model-row-count">Loading live models...</p>
          </div>
          <a class="button button-light" href="/dashboard">Create key</a>
        </div>
        <div class="model-search-row">
          <input id="model-search" type="search" placeholder="Search models or providers" aria-label="Search models or providers" />
        </div>
        <div class="model-table">
          <div class="model-row model-row-head">
            <span>Model</span>
            <span>Provider</span>
            <span>Type</span>
            <span>Context</span>
            <span>Input</span>
            <span>Output</span>
            <span>Status</span>
          </div>
          <div class="model-row">
            <strong>Loading models...</strong>
            <span>Backend</span>
            <span>...</span>
            <span>...</span>
            <span>...</span>
            <span>...</span>
            <b>Live</b>
          </div>
        </div>
      </section>
    </section>
  </main>
`
