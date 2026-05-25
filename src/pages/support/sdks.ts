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
  ],
  cta: { label: 'Open docs', href: '/docs' },
}
