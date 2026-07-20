import { brandMark, authAccountMarkup } from '../icons'

export const renderPlayground = () => `
  <main class="playground-page">
    <header class="dash-nav">
      <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
        ${brandMark}
        <span>Kiwi LLM</span>
      </a>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/models">Models</a>
        <a href="/docs">Docs</a>
        <a href="/">Home</a>
      </nav>
      ${authAccountMarkup(true)}
    </header>

    <section class="playground-shell">
      <div class="playground-hero">
        <div>
          <p class="section-kicker">PLAYGROUND</p>
          <h1>Test every model behind one Kiwi key.</h1>
          <p>Compose a prompt, pick a route, tune generation settings, and preview the request your app would send.</p>
        </div>
        <a class="button button-light" href="/dashboard">Create API key</a>
      </div>

      <section class="playground-grid">
        <article class="prompt-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Prompt</h2>
              <p>OpenAI-compatible chat request</p>
            </div>
            <span>Unsaved draft</span>
          </div>
          <label>
            System
            <textarea rows="4" placeholder="Optional system instructions"></textarea>
          </label>
          <label>
            User
            <textarea rows="8" placeholder="Type your prompt"></textarea>
          </label>
          <div class="prompt-actions">
            <button id="run-playground" class="button button-primary" type="button">Run prompt</button>
            <button id="save-preset" class="button button-ghost" type="button">Save preset</button>
          </div>
        </article>

        <aside class="settings-panel">
          <h2>Run settings</h2>
          <label>
            Model
            <select id="playground-model">
              <option>Loading models...</option>
            </select>
          </label>
          <label>
            Temperature
            <input type="range" min="0" max="2" step="0.1" value="0.7" />
            <span>0.7</span>
          </label>
          <label>
            Max tokens
            <input type="number" value="2048" />
          </label>
          <label class="toggle-row">
            <input type="checkbox" checked />
            <span>Stream response</span>
          </label>
          <label class="toggle-row">
            <input type="checkbox" />
            <span>JSON mode</span>
          </label>
        </aside>

        <article class="response-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Response preview</h2>
              <p>Live model output</p>
            </div>
            <span id="run-status">Ready</span>
          </div>
          <div id="assistant-output" class="assistant-output">
            <p><b>No run yet</b></p>
            <p>Choose a live model and run a prompt to see the real response here.</p>
          </div>
        </article>

        <article class="request-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Request JSON</h2>
              <p>Copy this into your app</p>
            </div>
            <button id="copy-request-json" type="button">Copy</button>
          </div>
          <pre><code id="request-json">{}</code></pre>
        </article>

        <aside class="history-panel">
          <h2>Recent runs</h2>
          <p class="empty-state">No runs loaded yet.</p>
        </aside>
      </section>
    </section>
  </main>
`
