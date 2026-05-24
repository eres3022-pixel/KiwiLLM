import './style.css'
import Lenis from 'lenis'

const clients = ['Claude CLI', 'Codex', 'Cursor', 'Continue', 'Cline', 'Roo Code']

const features = [
  {
    eyebrow: '01',
    title: 'One gateway, every model',
    text: 'Connect GPT, Claude, Gemini, local runners, and private endpoints behind a single OpenAI-style interface.',
  },
  {
    eyebrow: '02',
    title: 'Made for long agent runs',
    text: 'Reliable streaming, retries, traces, and budgets help coding agents keep moving without surprise spend.',
  },
  {
    eyebrow: '03',
    title: 'Usage you can actually read',
    text: 'Track tokens, teams, keys, and workspace limits with clear credit lines before billing becomes a mystery.',
  },
]

const modelCards = [
  {
    label: 'ANTHROPIC',
    mark: 'A',
    title: 'Claude without key juggling',
    chips: ['Opus route', 'Sonnet route', 'Haiku route'],
    text: 'Use native-style streaming and messages support through Kiwi, then swap model tiers without changing your client setup.',
  },
  {
    label: 'OPENAI',
    mark: 'O',
    title: 'GPT and Codex in one lane',
    chips: ['GPT frontier', 'mini tiers', 'Codex ready'],
    text: 'Keep OpenAI-compatible chat completions, token-aware usage, and reasoning model access behind one Kiwi endpoint.',
  },
  {
    label: 'EDITORS & CLIS',
    mark: 'K',
    title: 'Wire once, work anywhere',
    chips: ['Cursor', 'Roo Code', 'Cline', 'Continue'],
    text: 'Add your Kiwi key as a custom provider in the tools you already use. Same base URL, same team budget, every model.',
  },
]

const aboutCards = [
  {
    title: 'What it is',
    text: 'Kiwi LLM is a model gateway that brings hosted LLMs, custom providers, and private backends behind one OpenAI-compatible endpoint.',
  },
  {
    title: 'How it works',
    text: 'Create a Kiwi key, choose your routes, and send requests as usual. Kiwi handles provider auth, model selection, token usage, and credits.',
  },
  {
    title: 'Who it is for',
    text: 'Builders using Codex, Claude CLI, Cursor, Cline, and internal tools who want every model available without managing a pile of vendor keys.',
  },
]

const docExamples = [
  {
    title: 'Claude CLI',
    note: 'Messages route compatible',
    code: [
      'export ANTHROPIC_API_KEY=Kiwi_••••',
      'export ANTHROPIC_BASE_URL=https://api.kiwillm.dev/v1',
      'claude "review this pull request"',
    ],
  },
  {
    title: 'OpenAI SDK',
    note: 'Streaming and tools ready',
    code: [
      'from openai import OpenAI',
      'client = OpenAI(',
      '  api_key="Kiwi_••••",',
      '  base_url="https://api.kiwillm.dev/v1"',
      ')',
      'client.chat.completions.create(model="gpt-frontier")',
    ],
  },
  {
    title: 'Cursor / Roo / Cline',
    note: 'Use as a custom provider',
    code: [
      'Provider:  OpenAI Compatible',
      'Base URL:  https://api.kiwillm.dev/v1',
      'API Key:   Kiwi_••••',
      'Model:     claude-sonnet or any route',
    ],
  },
  {
    title: 'Codex CLI',
    note: 'Chat completions endpoint',
    code: [
      'export OPENAI_API_KEY=Kiwi_••••',
      'export OPENAI_BASE_URL=https://api.kiwillm.dev/v1',
      'codex "scaffold a fastapi service"',
    ],
  },
]

const docFeatures = [
  {
    title: 'OpenAI-compatible',
    text: 'Use chat completions and messages-style routes with streaming, tool calls, and stop sequences supported.',
  },
  {
    title: 'Route-level model control',
    text: 'Pin a key to a preferred model, or leave it open so any supported model id can pass through Kiwi.',
  },
  {
    title: 'Live credit tracking',
    text: 'Meter input and output tokens per request, then watch team spend update without waiting for invoices.',
  },
  {
    title: 'Team invite credits',
    text: 'Issue redeemable workspace codes, gift balances, and onboarding credits for new builders or teams.',
  },
  {
    title: 'Drop-in IDE support',
    text: 'Paste one base URL and one API key into Cursor, Roo Code, Cline, Continue, or your own internal client.',
  },
  {
    title: 'No provider lock-in',
    text: 'Change upstream vendors, pricing rules, or fallback models server-side while your app keeps the same endpoint.',
  },
]

const pricingPlans = [
  {
    price: '$10',
    name: 'Seed',
    credits: '350 credits',
  },
  {
    price: '$24',
    name: 'Grow',
    credits: '900 credits',
  },
  {
    price: '$49',
    name: 'Scale',
    credits: '1,950 credits',
  },
  {
    price: '$99',
    name: 'Launch',
    credits: '4,200 credits',
    badge: 'BEST VALUE',
  },
]

const footerColumns = [
  {
    title: 'Build',
    links: ['Docs', 'Playground', 'SDKs', 'Status'],
  },
  {
    title: 'Company',
    links: ['Blog', 'Pricing', 'Roadmap', 'Changelog'],
  },
  {
    title: 'Connect',
    links: ['Discord', 'Telegram', 'X / Twitter', 'GitHub'],
  },
]

const dashboardPlaceholders = ['Credit balance', 'Requests', 'Tokens', 'Credits used']

const topUpPlans = [
  { price: '$10', name: 'Seed', credits: '350 credits' },
  { price: '$24', name: 'Grow', credits: '900 credits' },
  { price: '$49', name: 'Scale', credits: '1,950 credits' },
  { price: '$99', name: 'Launch', credits: '4,200 credits' },
]

const allowedModels = [
  'gpt-frontier',
  'gpt-mini-fast',
  'claude-sonnet-route',
  'claude-opus-route',
  'claude-haiku-route',
  'qwen-coder-fast',
  'kimi-reasoner',
  'glm-agentic',
  'deepseek-v4-pro',
  'gemini-flash-route',
  'image-frontier',
  'video-frontier',
  'local-llama-70b',
  'mistral-code',
  'openrouter-any',
]

const modelFilters = ['All', 'Text', 'Code', 'Reasoning', 'Image', 'Video']


const docsCodeBlocks = [
  {
    section: 'Quick test',
    title: 'OPENAI-STYLE REQUEST',
    code: `curl https://api.kiwillm.dev/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-frontier",
    "messages": [{"role":"user","content":"hello"}]
  }'`,
  },
  {
    section: 'Quick test',
    title: 'ANTHROPIC-STYLE REQUEST',
    code: `curl https://api.kiwillm.dev/v1/messages \\
  -H "x-api-key: YOUR_KIWI_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "claude-sonnet-route",
    "max_tokens": 256,
    "messages": [{"role":"user","content":"hello"}]
  }'`,
  },
  {
    section: 'Quick test',
    title: 'LIST MODELS',
    code: 'curl https://api.kiwillm.dev/v1/models -H "Authorization: Bearer YOUR_KIWI_KEY"',
  },
  {
    section: 'Images',
    title: 'CURL',
    code: `curl https://api.kiwillm.dev/v1/images/generations \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "image-frontier",
    "prompt": "a luminous kiwi dashboard floating in deep space",
    "n": 1,
    "size": "1024x1024"
  }'`,
  },
  {
    section: 'Images',
    title: 'NODE / TYPESCRIPT',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "YOUR_KIWI_KEY",
  baseURL: "https://api.kiwillm.dev/v1",
});

const image = await client.images.generate({
  model: "image-frontier",
  prompt: "a luminous kiwi dashboard floating in deep space",
  n: 1,
  size: "1024x1024",
});

console.log(image.data?.[0]?.url);`,
  },
  {
    section: 'Video',
    title: 'CURL',
    code: `curl https://api.kiwillm.dev/v1/video/generations \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "video-frontier",
    "prompt": "a slow dolly shot through a neon server room",
    "n": 1
  }'`,
  },
  {
    section: 'Video',
    title: 'JAVASCRIPT FETCH',
    code: `const res = await fetch("https://api.kiwillm.dev/v1/video/generations", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_KIWI_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "video-frontier",
    prompt: "a slow dolly shot through a neon server room",
    n: 1,
  }),
});

const video = await res.json();
console.log(video.data?.[0]?.url ?? video);`,
  },
  {
    section: 'Claude',
    title: 'MACOS / LINUX',
    code: `export ANTHROPIC_BASE_URL="https://api.kiwillm.dev/v1"
export ANTHROPIC_API_KEY="YOUR_KIWI_KEY"
export ANTHROPIC_MODEL="claude-sonnet-route"

claude "explain this repository"`,
  },
  {
    section: 'Claude',
    title: 'WINDOWS POWERSHELL',
    code: `$env:ANTHROPIC_BASE_URL = "https://api.kiwillm.dev/v1"
$env:ANTHROPIC_API_KEY = "YOUR_KIWI_KEY"
$env:ANTHROPIC_MODEL = "claude-sonnet-route"

claude "hello"`,
  },
  {
    section: 'Aider',
    title: 'ANTHROPIC MODE',
    code: `export ANTHROPIC_API_KEY="YOUR_KIWI_KEY"
export ANTHROPIC_API_BASE="https://api.kiwillm.dev/v1"
aider --model anthropic/claude-sonnet-route`,
  },
  {
    section: 'Aider',
    title: 'OPENAI MODE',
    code: `export OPENAI_API_KEY="YOUR_KIWI_KEY"
export OPENAI_API_BASE="https://api.kiwillm.dev/v1"
aider --model openai/gpt-frontier`,
  },
  {
    section: 'Continue',
    title: 'CONFIG.JSON',
    code: `{
  "models": [
    {
      "title": "Kiwi - Coding Agent",
      "provider": "openai",
      "model": "gpt-frontier",
      "apiBase": "https://api.kiwillm.dev/v1",
      "apiKey": "YOUR_KIWI_KEY"
    }
  ]
}`,
  },
  {
    section: 'SDK',
    title: 'PYTHON',
    code: `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_KIWI_KEY",
    base_url="https://api.kiwillm.dev/v1",
)

resp = client.chat.completions.create(
    model="gpt-frontier",
    messages=[{"role": "user", "content": "hi"}],
)
print(resp.choices[0].message.content)`,
  },
  {
    section: 'SDK',
    title: 'NODE / TYPESCRIPT',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "YOUR_KIWI_KEY",
  baseURL: "https://api.kiwillm.dev/v1",
});

const r = await client.chat.completions.create({
  model: "gpt-frontier",
  messages: [{ role: "user", content: "hi" }],
});
console.log(r.choices[0].message.content);`,
  },
]

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const codePanel = (title: string, code: string) => `
  <div class="docs-code-card">
    <div class="docs-code-title">
      <span>${title}</span>
      <button class="copy-button" type="button" data-copy="${escapeHtml(code)}">Copy</button>
    </div>
    <pre><code>${escapeHtml(code)}</code></pre>
  </div>
`

const api = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json() as Promise<T>
}

const renderHome = () => `
  <main class="site-shell">
    <nav class="topbar" aria-label="Primary navigation">
      <a class="brand" href="/" aria-label="Kiwi LLM home">
        <span class="brand-orb" aria-hidden="true">K</span>
        <span>Kiwi LLM</span>
      </a>
      <div class="nav-links" aria-label="Product sections">
        <a href="#home">Home</a>
        <span aria-hidden="true"></span>
        <a href="#how">How</a>
        <span aria-hidden="true"></span>
        <a href="/docs">Docs</a>
        <span aria-hidden="true"></span>
        <a href="/playground">Playground</a>
        <span aria-hidden="true"></span>
        <a href="#pricing">Pricing</a>
      </div>
      <div class="nav-actions">
        <a class="signin" href="#signin">Sign in</a>
        <a class="button button-light" href="/dashboard">Get started</a>
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
<span>$</span> export KIWI_URL=https://api.kiwillm.dev/v1
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
          <code>POST https://api.kiwillm.dev/v1/chat/completions</code>
          <code>POST https://api.kiwillm.dev/v1/messages</code>
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
        <p>Claude, GPT, Gemini, Qwen, Kimi, GLM, and private routes for high-effort coding and agent sessions.</p>
        <small>Payment method: card, UPI, or USDT credits depending on workspace region.</small>
      </div>

      <div class="pricing-actions reveal-item">
        <a class="button button-primary" href="/dashboard"><span aria-hidden="true">↗</span> Buy credits</a>
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
                ${column.links.map((link) => `<a href="${link === 'Docs' ? '/docs' : '#'}">${link}</a>`).join('')}
              </nav>
            `,
          )
          .join('')}
      </div>

      <p class="footer-wordmark reveal-item" aria-label="Kiwi LLM">Kiwi LLM</p>

      <div class="footer-bottom reveal-item">
        <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
          <span class="brand-orb" aria-hidden="true">K</span>
          <span>Kiwi LLM</span>
        </a>
        <div>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Security</a>
        </div>
        <p>© 2026 Kiwi LLM</p>
      </div>
    </footer>
  </main>
`

const renderDocs = () => `
  <main class="docs-page">
    <header class="docs-nav">
      <a class="docs-logo" href="/">Kiwi LLM</a>
      <span>Docs</span>
      <nav>
        <a href="/playground">Playground</a>
        <a href="/dashboard">Dashboard</a>
        <a href="/models">Models</a>
      </nav>
    </header>

    <article class="docs-container">
      <section class="docs-hero">
        <h1>Connect any client to Kiwi LLM</h1>
        <p>
          Kiwi exposes OpenAI-style chat, Anthropic-style messages, image, video, and model-list endpoints through one base URL.
          Any client that speaks either protocol can use the same Kiwi key and route to the models your workspace enables.
        </p>
      </section>

      <section class="docs-block">
        <h2>Three things you need</h2>
        <div class="need-grid">
          <article><span>Base URL</span><code>https://api.kiwillm.dev/v1</code></article>
          <article><span>API key</span><code>Kiwi_xxxxxxxxxxxx</code><p>Create one from your dashboard.</p></article>
          <article><span>Model id</span><code>gpt-frontier</code><p>Use text models for chat, image models for images, and video models for video runs.</p></article>
        </div>
      </section>

      <section class="docs-block">
        <h2>Quick test</h2>
        <p>Paste these into your terminal and replace <code>YOUR_KIWI_KEY</code> with a real workspace key.</p>
        ${docsCodeBlocks.filter((block) => block.section === 'Quick test').map((block) => codePanel(block.title, block.code)).join('')}
        <p class="docs-note">The model list includes modality metadata so clients can avoid sending image or video models to chat endpoints.</p>
      </section>

      <section class="docs-block">
        <h2>Image generation</h2>
        <p>Use image-capable routes with the OpenAI-style <code>/images/generations</code> endpoint.</p>
        ${docsCodeBlocks.filter((block) => block.section === 'Images').map((block) => codePanel(block.title, block.code)).join('')}
        <div class="docs-callout">
          <b>Fields:</b> model, prompt, n, and size. <b>Billing:</b> generated assets use the configured model output price.
        </div>
      </section>

      <section class="docs-block">
        <h2>Video generation</h2>
        <p>Video routes use <code>/video/generations</code>. Provider-specific fields can pass through when enabled on the upstream route.</p>
        ${docsCodeBlocks.filter((block) => block.section === 'Video').map((block) => codePanel(block.title, block.code)).join('')}
        <p class="docs-note">Some video providers return async job responses. Keep the returned id or status URL and poll according to that provider response.</p>
      </section>

      <section class="docs-block">
        <h2>Claude Code CLI</h2>
        <p>Set Anthropic environment variables once, then run Claude through Kiwi.</p>
        ${docsCodeBlocks.filter((block) => block.section === 'Claude').map((block) => codePanel(block.title, block.code)).join('')}
      </section>

      <section class="docs-block">
        <h2>Roo Code and Cline</h2>
        <p>Use Kiwi as either an Anthropic-compatible or OpenAI-compatible provider.</p>
        <div class="docs-two-col">
          <article><h3>Anthropic provider</h3><p>Provider: Anthropic<br>API key: YOUR_KIWI_KEY<br>Custom base URL: https://api.kiwillm.dev/v1<br>Model: claude-sonnet-route</p></article>
          <article><h3>OpenAI-compatible provider</h3><p>Provider: OpenAI Compatible<br>Base URL: https://api.kiwillm.dev/v1<br>API key: YOUR_KIWI_KEY<br>Model: gpt-frontier</p></article>
        </div>
      </section>

      <section class="docs-block">
        <h2>Aider</h2>
        <p>OpenAI and Anthropic modes both work; choose the route that matches your selected model.</p>
        ${docsCodeBlocks.filter((block) => block.section === 'Aider').map((block) => codePanel(block.title, block.code)).join('')}
      </section>

      <section class="docs-block">
        <h2>Continue.dev</h2>
        <p>Edit <code>~/.continue/config.json</code> and point the model at Kiwi.</p>
        ${docsCodeBlocks.filter((block) => block.section === 'Continue').map((block) => codePanel(block.title, block.code)).join('')}
      </section>

      <section class="docs-block">
        <h2>OpenAI SDK</h2>
        <p>Override <code>base_url</code> or <code>baseURL</code>; the rest of the SDK usage stays familiar.</p>
        ${docsCodeBlocks.filter((block) => block.section === 'SDK').map((block) => codePanel(block.title, block.code)).join('')}
      </section>

      <section class="docs-block">
        <h2>Troubleshooting</h2>
        <div class="trouble-list">
          <p><b>401 invalid key</b> — confirm the key starts with <code>Kiwi_</code> and is still active.</p>
          <p><b>402 out of credits</b> — add credits or redeem a team invite code.</p>
          <p><b>403 model not allowed</b> — your workspace route may not include that model yet.</p>
          <p><b>404 model not available</b> — call <code>/models</code> to see the live list.</p>
          <p><b>Modality mismatch</b> — chat models use chat/messages, image models use images, and video models use videos.</p>
          <p><b>Streaming hangs</b> — send <code>"stream": true</code> and read event-stream chunks line by line.</p>
        </div>
      </section>

      <div class="docs-back">
        <a class="button button-light" href="/">Back to homepage</a>
      </div>
    </article>
  </main>
`

const barChart = (values: number[], label: string) => `
  <div class="dash-bars" aria-label="${label}">
    ${values.map((value) => `<span style="--bar:${value}%"></span>`).join('')}
  </div>
`

const renderDashboard = () => `
  <main class="dashboard-page">
    <header class="dash-nav">
      <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
        <span class="brand-orb" aria-hidden="true">K</span>
        <span>Kiwi LLM</span>
      </a>
      <nav>
        <a href="/playground">Playground</a>
        <a href="/docs">Docs</a>
        <a href="/">Home</a>
      </nav>
      <div class="dash-account">
        <span id="workspace-email">Workspace</span>
        <button type="button">Sign out</button>
      </div>
    </header>

    <section class="dash-shell">
      <div class="dash-hero">
        <div>
          <p class="section-kicker">DASHBOARD</p>
          <h1>Good night, <em>builder</em></h1>
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
            <button type="button">New key</button>
          </div>
          <p class="empty-state">Loading keys from backend...</p>
        </article>
      </section>

      <section class="dash-actions">
        <article>
          <span>QUICK START</span>
          <h2>Send a test request</h2>
          <pre><code>curl https://api.kiwillm.dev/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_KIWI_KEY" \\
  -d '{"model":"gpt-frontier","messages":[{"role":"user","content":"hi"}]}'</code></pre>
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
            <h2>Plans and top-up</h2>
            <p>Add credits with crypto or card, then spend them across every enabled model.</p>
          </div>
          <span>Credits never fragment by provider</span>
        </div>
        <div class="topup-grid">
          ${topUpPlans
            .map(
              (plan) => `
                <article>
                  <h3>${plan.price} · ${plan.name}</h3>
                  <p>${plan.credits}</p>
                  <a href="#">Top up with USDT →</a>
                </article>
              `,
            )
            .join('')}
        </div>
        <div class="topup-included">
          <h3>Included in every paid workspace</h3>
          <p>High-effort coding models, image and video routes, per-key budgets, live metering, and shared team usage history.</p>
        </div>
        <small>Payment methods can vary by workspace region. Balance updates after payment confirmation.</small>
      </section>

      <section class="key-builder-panel">
        <div class="dash-panel-head">
          <div>
            <h2>Create an API key</h2>
            <p>Name the key, choose model access, and optionally pin it for clients that only send one model id.</p>
          </div>
          <span>Step 2 of 2</span>
        </div>
        <div class="key-builder-form">
          <input id="key-name" type="text" placeholder="Key name, e.g. codex-production" aria-label="Key name" />
          <select id="key-mode" aria-label="Model routing mode">
            <option>Any model the client chooses</option>
            <option>Pin to selected model</option>
            <option>Only allow selected models</option>
          </select>
        </div>
        <div class="model-picker-head">
          <p><a href="/models">Allowed models</a></p>
          <div>
            <button type="button">Select all</button>
            <button type="button">Clear</button>
          </div>
        </div>
        <p class="paid-note">Paid models are visible here. Free workspaces will see an upgrade prompt if a restricted route is used.</p>
        <div class="model-picker">
          ${allowedModels
            .map(
              (model, index) => `
                <label>
                  <input type="checkbox" value="${model}" ${index < 5 ? 'checked' : ''} />
                  <span>${model}${model.includes('frontier') || model.includes('opus') ? ' ◆' : ''}</span>
                </label>
              `,
            )
            .join('')}
        </div>
        <div class="key-builder-footer">
          <button id="create-key-button" class="button button-light" type="button">Create key</button>
          <p id="create-key-message">Model pinning lets Claude CLI, Codex, and IDE clients keep a simple config while Kiwi routes to your chosen model.</p>
        </div>
      </section>
    </section>
  </main>
`

const renderModels = () => `
  <main class="models-page">
    <header class="dash-nav">
      <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
        <span class="brand-orb" aria-hidden="true">K</span>
        <span>Kiwi LLM</span>
      </a>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/models">Models</a>
        <a href="/docs">Docs</a>
        <a href="/">Home</a>
      </nav>
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
          <h2>Available models</h2>
          <a class="button button-light" href="/dashboard">Create key</a>
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

const renderPlayground = () => `
  <main class="playground-page">
    <header class="dash-nav">
      <a class="footer-brand" href="/" aria-label="Kiwi LLM home">
        <span class="brand-orb" aria-hidden="true">K</span>
        <span>Kiwi LLM</span>
      </a>
      <nav>
        <a href="/dashboard">Dashboard</a>
        <a href="/models">Models</a>
        <a href="/docs">Docs</a>
        <a href="/">Home</a>
      </nav>
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
            <button class="button button-ghost" type="button">Save preset</button>
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

const app = document.querySelector<HTMLDivElement>('#app')!
const isDocsPage = window.location.pathname === '/docs'
const isDashboardPage = window.location.pathname === '/dashboard'
const isModelsPage = window.location.pathname === '/models'
const isPlaygroundPage = window.location.pathname === '/playground'
document.title = isDocsPage
  ? 'Docs - Kiwi LLM'
  : isDashboardPage
    ? 'Dashboard - Kiwi LLM'
    : isModelsPage
      ? 'Models - Kiwi LLM'
      : isPlaygroundPage
        ? 'Playground - Kiwi LLM'
        : 'Kiwi LLM'
app.innerHTML = isDocsPage
  ? renderDocs()
  : isDashboardPage
    ? renderDashboard()
    : isModelsPage
      ? renderModels()
      : isPlaygroundPage
        ? renderPlayground()
        : renderHome()

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!prefersReducedMotion) {
  const lenis = new Lenis({
    duration: 1.25,
    smoothWheel: true,
    wheelMultiplier: 0.84,
    touchMultiplier: 1.08,
    easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
  })

  const raf = (time: number) => {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
}

if (!isDocsPage && !isDashboardPage && !isModelsPage && !isPlaygroundPage) {
  const revealItems = [...document.querySelectorAll<HTMLElement>('.reveal-item')]

  revealItems.forEach((item, index) => {
    item.style.setProperty('--reveal-delay', `${Math.min(index % 8, 6) * 70}ms`)
  })

  if (prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'))
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          } else {
            entry.target.classList.remove('is-visible')
          }
        })
      },
      {
        threshold: 0.12,
        rootMargin: '-6% 0px -10% 0px',
      },
    )

    revealItems.forEach((item) => observer.observe(item))
  }
}

document.querySelectorAll<HTMLButtonElement>('.copy-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const text = button.dataset.copy ?? ''
    await navigator.clipboard.writeText(text)
    button.textContent = 'Copied'
    setTimeout(() => {
      button.textContent = 'Copy'
    }, 1200)
  })
})

if (isDashboardPage) {
  type DashboardPayload = {
    workspace: {
      email: string
      creditUsd: number
      credits: number
      usedUsd30d: number
      usedCredits30d: number
      requests30d: number
      tokens30d: number
    }
    stats: Array<{ label: string; value: string; note: string; trend: string }>
    limits?: { plan: string; rpm: number; rpd: number }
    keys: Array<{ name: string; key: string; scope: string; lastUsed: string }>
    usage: {
      tokenBars: number[]
      requestBars: number[]
      spendByModel: Array<{ model: string; requests: number; spend: number; width: number }>
    }
  }

  type ModelPayload = {
    models: Array<{ id: string; provider: string; type: string; context: string; input: number | null; output: number | null; status: string }>
  }

  const updateBars = (selector: string, values: number[]) => {
    const bars = document.querySelector<HTMLElement>(selector)
    if (!bars) return
    bars.innerHTML = values.map((value) => `<span style="--bar:${value}%"></span>`).join('')
  }

  const hydrateDashboard = async () => {
    const data = await api<DashboardPayload>('/api/dashboard')
    const workspaceEmail = document.querySelector<HTMLElement>('#workspace-email')
    const workspaceHealth = document.querySelector<HTMLElement>('#workspace-health')
    const workspaceHealthNote = document.querySelector<HTMLElement>('#workspace-health-note')
    const tokenTotal = document.querySelector<HTMLElement>('#token-total')
    const requestTotal = document.querySelector<HTMLElement>('#request-total')
    const spendTotal = document.querySelector<HTMLElement>('#spend-total')

    if (workspaceEmail) workspaceEmail.textContent = data.workspace.email || 'Workspace'
    if (workspaceHealth) workspaceHealth.textContent = 'Live'
    const limits = data.limits || { plan: 'Free', rpm: 5, rpd: 200 }
    if (workspaceHealthNote) workspaceHealthNote.textContent = `${limits.plan} plan: ${limits.rpm} RPM / ${limits.rpd} RPD`
    if (tokenTotal) tokenTotal.textContent = `${data.workspace.tokens30d.toLocaleString()} tokens`
    if (requestTotal) requestTotal.textContent = `${data.workspace.requests30d.toLocaleString()} requests`
    if (spendTotal) spendTotal.textContent = `${data.workspace.usedCredits30d.toLocaleString()} credits`

    document.querySelectorAll<HTMLElement>('.dash-stats article').forEach((card, index) => {
      const stat = data.stats[index]
      if (!stat) return
      card.querySelector('span')!.textContent = stat.label
      card.querySelector('b')!.textContent = stat.trend
      card.querySelector('strong')!.textContent = stat.value
      card.querySelector('p')!.textContent = stat.note
    })

    const keyPanel = document.querySelector<HTMLElement>('.dash-keys')
    if (keyPanel) {
      keyPanel.querySelectorAll('.key-row').forEach((row) => row.remove())
      keyPanel.querySelector('.empty-state')?.remove()
      keyPanel.insertAdjacentHTML(
        'beforeend',
        data.keys.length
          ? data.keys
              .map(
                (item) => `
              <div class="key-row">
                <div><strong>${escapeHtml(item.name)}</strong><code>${escapeHtml(item.key)}</code></div>
                <span>${escapeHtml(item.scope)}</span>
                <small>${escapeHtml(item.lastUsed)}</small>
              </div>
            `,
              )
              .join('')
          : '<p class="empty-state">No keys yet. Create one below to start sending requests.</p>',
      )
    }

    updateBars('.dash-wide .dash-bars', data.usage.tokenBars)
    updateBars('.dash-panel:not(.dash-wide) .dash-bars', data.usage.requestBars)

    const spendList = document.querySelector<HTMLElement>('.model-spend-list')
    if (spendList) {
      spendList.innerHTML = data.usage.spendByModel.length
        ? data.usage.spendByModel
            .map(
              (item) => `
                <div>
                  <header><span>${escapeHtml(item.model)}</span><b>$${item.spend.toFixed(2)}</b></header>
                  <p>${item.requests.toLocaleString()} requests</p>
                  <i style="--fill:${item.width}%"></i>
                </div>
              `,
            )
            .join('')
        : '<p class="empty-state">No requests yet. Run the playground or use a key to see model spend.</p>'
    }
  }

  hydrateDashboard().catch((error) => {
    const workspaceHealth = document.querySelector<HTMLElement>('#workspace-health')
    const workspaceHealthNote = document.querySelector<HTMLElement>('#workspace-health-note')
    if (workspaceHealth) workspaceHealth.textContent = 'Offline'
    if (workspaceHealthNote) workspaceHealthNote.textContent = error instanceof Error ? error.message : 'Dashboard API unavailable'
  })

  const dashboardRefresh = window.setInterval(() => {
    hydrateDashboard().catch(console.error)
  }, 5000)
  window.addEventListener('beforeunload', () => window.clearInterval(dashboardRefresh))

  api<ModelPayload>('/api/models')
    .then(({ models }) => {
      const picker = document.querySelector<HTMLElement>('.model-picker')
      if (!picker) return
      picker.innerHTML = models
        .map(
          (model, index) => `
            <label>
              <input type="checkbox" value="${escapeHtml(model.id)}" ${index < 5 ? 'checked' : ''} />
              <span>${escapeHtml(model.id)}${model.status === 'Paid' ? ' ◆' : ''}</span>
            </label>
          `,
        )
        .join('')
    })
    .catch(console.error)

  document.querySelector<HTMLButtonElement>('#redeem-button')?.addEventListener('click', async () => {
    const input = document.querySelector<HTMLInputElement>('#redeem-code')
    const message = document.querySelector<HTMLElement>('#redeem-message')
    try {
      const result = await api<{ creditsAdded: number }>('/api/redeem', {
        method: 'POST',
        body: JSON.stringify({ code: input?.value }),
      })
      if (message) message.textContent = `Success. Added ${result.creditsAdded} credits to your workspace.`
      if (input) input.value = ''
      await hydrateDashboard()
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : 'Could not redeem code.'
    }
  })

  document.querySelector<HTMLButtonElement>('#create-key-button')?.addEventListener('click', async () => {
    const name = document.querySelector<HTMLInputElement>('#key-name')?.value || 'Dashboard key'
    const models = [...document.querySelectorAll<HTMLInputElement>('.model-picker input:checked')].map((input) => input.value)
    const message = document.querySelector<HTMLElement>('#create-key-message')
    try {
      const created = await api<{ key: string }>('/api/keys', {
        method: 'POST',
        body: JSON.stringify({ name, models }),
      })
      if (message) message.textContent = `Created key: ${created.key}`
      await hydrateDashboard()
    } catch (error) {
      if (message) message.textContent = error instanceof Error ? error.message : 'Could not create key.'
    }
  })
}

if (isModelsPage) {
  type ModelPayload = {
    models: Array<{ id: string; provider: string; type: string; context: string; input: number | null; output: number | null; status: string }>
    summary?: { total: number; text: number; code: number; reasoning: number; image: number; video: number }
  }

  const priceText = (value: number | null) => (typeof value === 'number' ? `$${value.toFixed(2)}` : 'Provider')
  const summarizeModels = (models: ModelPayload['models']) => ({
    total: models.length,
    text: models.filter((model) => model.type === 'Text').length,
    code: models.filter((model) => model.type === 'Code').length,
    reasoning: models.filter((model) => model.type === 'Reasoning').length,
    image: models.filter((model) => model.type === 'Image').length,
    video: models.filter((model) => model.type === 'Video').length,
  })
  const renderModelRows = (models: ModelPayload['models']) => {
    const table = document.querySelector('.model-table')
    if (!table) return
    table.querySelectorAll('.model-row:not(.model-row-head)').forEach((row) => row.remove())
    table.insertAdjacentHTML(
      'beforeend',
      models.length
        ? models
            .map(
              (model) => `
              <div class="model-row" data-type="${escapeHtml(model.type)}">
                <strong>${escapeHtml(model.id)}</strong>
                <span>${escapeHtml(model.provider)}</span>
                <span>${escapeHtml(model.type)}</span>
                <span>${escapeHtml(model.context)}</span>
                <span>${priceText(model.input)}</span>
                <span>${priceText(model.output)}</span>
                <b class="${model.status === 'Paid' ? 'paid' : ''}">${escapeHtml(model.status)}</b>
              </div>
            `,
            )
            .join('')
        : '<div class="model-row"><strong>No models found</strong><span>Gateway</span><span>...</span><span>...</span><span>...</span><span>...</span><b>Empty</b></div>',
    )
  }

  api<ModelPayload>('/api/models')
    .then(({ models, summary }) => {
      const modelSummary = summary || summarizeModels(models)
      const total = document.querySelector<HTMLElement>('#model-total')
      const textCode = document.querySelector<HTMLElement>('#model-text-code')
      const media = document.querySelector<HTMLElement>('#model-media')
      if (total) total.textContent = modelSummary.total.toLocaleString()
      if (textCode) textCode.textContent = (modelSummary.text + modelSummary.code + modelSummary.reasoning).toLocaleString()
      if (media) media.textContent = (modelSummary.image + modelSummary.video).toLocaleString()

      renderModelRows(models)

      document.querySelectorAll<HTMLButtonElement>('.model-filter-row button').forEach((button) => {
        button.addEventListener('click', () => {
          const filter = button.textContent?.trim() || 'All'
          document.querySelectorAll<HTMLButtonElement>('.model-filter-row button').forEach((item) => item.classList.remove('active'))
          button.classList.add('active')
          renderModelRows(filter === 'All' ? models : models.filter((model) => model.type === filter))
        })
      })
    })
    .catch(console.error)
}

if (isPlaygroundPage) {
  type ModelPayload = {
    models: Array<{ id: string; provider: string; type: string; context: string; input: number | null; output: number | null; status: string }>
  }

  const requestJson = () => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('.prompt-panel textarea')
    const model = document.querySelector<HTMLSelectElement>('#playground-model')?.value || ''
    const temperature = Number(document.querySelector<HTMLInputElement>('.settings-panel input[type="range"]')?.value || 0.7)
    const maxTokens = Number(document.querySelector<HTMLInputElement>('.settings-panel input[type="number"]')?.value || 2048)
    return {
      model,
      stream: false,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: textareas[0]?.value || '' },
        { role: 'user', content: textareas[1]?.value || '' },
      ],
    }
  }

  const updateRequestJson = () => {
    const code = document.querySelector<HTMLElement>('#request-json')
    if (code) code.textContent = JSON.stringify(requestJson(), null, 2)
  }

  const hydratePlaygroundModels = async () => {
    const data = await api<ModelPayload>('/api/models')
    const select = document.querySelector<HTMLSelectElement>('#playground-model')
    if (!select) return
    select.innerHTML = data.models
      .map((model) => `<option value="${escapeHtml(model.id)}">${escapeHtml(model.id)} · ${escapeHtml(model.provider)}</option>`)
      .join('')
    updateRequestJson()
  }

  const hydrateRuns = async () => {
    const data = await api<{ runs: Array<{ title: string; model: string; tokens: number; createdAt: string }> }>('/api/playground/runs')
    const panel = document.querySelector<HTMLElement>('.history-panel')
    if (!panel) return
    panel.querySelectorAll('div, .empty-state').forEach((item) => item.remove())
    panel.insertAdjacentHTML(
      'beforeend',
      data.runs.length
        ? data.runs
            .map(
              (item) => `
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <span>${escapeHtml(item.model)}</span>
                  <small>${item.tokens.toLocaleString()} tokens · ${new Date(item.createdAt).toLocaleString()}</small>
                </div>
              `,
            )
            .join('')
        : '<p class="empty-state">No runs yet. Run a prompt to create the first backend record.</p>',
    )
  }

  hydratePlaygroundModels().catch((error) => {
    const output = document.querySelector<HTMLElement>('#assistant-output')
    if (output) output.innerHTML = `<p><b>Could not load models</b></p><p>${escapeHtml(error instanceof Error ? error.message : 'Model list unavailable.')}</p>`
  })
  hydrateRuns().catch(console.error)
  updateRequestJson()

  document.querySelectorAll<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>('.prompt-panel textarea, .settings-panel input, #playground-model').forEach((input) => {
    input.addEventListener('input', updateRequestJson)
    input.addEventListener('change', updateRequestJson)
  })

  document.querySelector<HTMLButtonElement>('#copy-request-json')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(JSON.stringify(requestJson(), null, 2))
  })

  document.querySelector<HTMLButtonElement>('#run-playground')?.addEventListener('click', async () => {
    const textareas = document.querySelectorAll<HTMLTextAreaElement>('.prompt-panel textarea')
    const model = document.querySelector<HTMLSelectElement>('#playground-model')?.value || ''
    const temperature = Number(document.querySelector<HTMLInputElement>('.settings-panel input[type="range"]')?.value || 0.7)
    const maxTokens = Number(document.querySelector<HTMLInputElement>('.settings-panel input[type="number"]')?.value || 2048)
    const output = document.querySelector<HTMLElement>('#assistant-output')
    const status = document.querySelector<HTMLElement>('#run-status')
    if (output) output.innerHTML = '<p><b>Running...</b></p><p>Kiwi is routing your request to the live model.</p>'
    if (status) status.textContent = 'Running'
    try {
      const run = await api<{ response: string; tokens: number; spend: number }>('/api/playground/run', {
        method: 'POST',
        body: JSON.stringify({ model, system: textareas[0]?.value || '', prompt: textareas[1]?.value || '', temperature, maxTokens }),
      })
      if (output) {
        output.innerHTML = `<p><b>Run complete</b></p><p>${escapeHtml(run.response)}</p><p>${run.tokens.toLocaleString()} tokens · $${run.spend.toFixed(4)} estimated spend</p>`
      }
      if (status) status.textContent = 'Complete'
      await hydrateRuns()
    } catch (error) {
      if (output) output.innerHTML = `<p><b>Run failed</b></p><p>${escapeHtml(error instanceof Error ? error.message : 'Could not run prompt.')}</p>`
      if (status) status.textContent = 'Failed'
    }
  })
}

