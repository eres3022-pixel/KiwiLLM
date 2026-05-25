import type { SupportPage } from '../supportPages'

export const sdksPage: SupportPage = {
  title: 'SDKs - Kiwi LLM',
  label: 'SDKs',
  eyebrow: 'BUILD',
  intro: 'Kiwi works with existing OpenAI-compatible and Anthropic-compatible clients, so you can start without waiting for a custom SDK.',
  blocks: [
    {
      title: 'Supported clients',
      text: 'Use the OpenAI SDK, Anthropic-compatible CLIs, Cursor, Cline, Roo Code, Continue, Codex, and custom fetch clients.',
      items: ['Base URL: https://api.kiwillm.in/v1', 'Auth: Authorization: Bearer YOUR_KIWI_KEY', 'Models: choose any live route from /models'],
      },
      { title: 'Examples', text: 'Full cURL, Python, Node, CLI, image, and video examples are available in the docs.' },
      {
        title: 'OpenAI-Compatible Setup',
        text: 'For OpenAI-compatible clients, set the Kiwi base URL, pass your Kiwi key as the bearer token, and choose one of the model ids shown on the models page.',
        items: ['Use /v1/chat/completions for chat requests.', 'Use /v1/models to inspect available routes.', 'Keep per-environment keys separate.'],
      },
      {
        title: 'Anthropic-Compatible Setup',
        text: 'For Anthropic-style clients, configure the Anthropic base URL to Kiwi and pass your Kiwi key through the expected API key environment variable.',
      },
      {
        title: 'Versioning Notes',
        text: 'Kiwi aims to preserve stable OpenAI-style request shapes, but upstream model capabilities and provider-specific fields may change as providers update their APIs.',
      },
    ],
  cta: { label: 'Open docs', href: '/docs' },
}
