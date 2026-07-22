import { brandMark, authAccountMarkup } from '../icons'
import { docsCodeBlocks, pageLinks } from '../data'
import { codePanel, pageHeader } from '../helpers'

export const renderDocs = () => `
  <main class="docs-page">
    ${pageHeader(brandMark, pageLinks, authAccountMarkup)}

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
          <article><span>Base URL</span><code>https://api.kiwillm.in/v1</code></article>
          <article><span>API key</span><code>Kiwi_xxxxxxxxxxxx</code><p>Create one from your dashboard.</p></article>
          <article><span>Model id</span><code>llama-3.2-1b</code><p>Use text models for chat, image models for images, and video models for video runs.</p></article>
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
          <article><h3>Anthropic provider</h3><p>Provider: Anthropic<br>API key: YOUR_KIWI_KEY<br>Custom base URL: https://api.kiwillm.in/v1<br>Model: claude-sonnet P1</p></article>
          <article><h3>OpenAI-compatible provider</h3><p>Provider: OpenAI Compatible<br>Base URL: https://api.kiwillm.in/v1<br>API key: YOUR_KIWI_KEY<br>Model: llama-3.2-1b</p></article>
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
          <p><b>Long responses</b> — raise <code>max_tokens</code> and keep prompts compact when a provider truncates output.</p>
        </div>
      </section>

      <div class="docs-back">
        <a class="button button-light" href="/">Back to homepage</a>
      </div>
    </article>
  </main>
`
