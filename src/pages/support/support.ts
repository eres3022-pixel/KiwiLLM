import type { SupportPage } from '../supportPages'

export const supportPageContent: SupportPage = {
  title: 'Support - Kiwi LLM',
  label: 'Support',
  eyebrow: 'HELP',
  intro: 'Get help with setup, keys, billing, model routes, and production gateway behavior.',
  blocks: [
    {
      title: 'Before you write in',
      text: 'Check your base URL, key prefix, CORS origin, Supabase session, and credit balance. Most setup issues come from one of those five places.',
      items: ['Base URL should be https://api.kiwillm.in/v1.', 'API keys should start with Kiwi_.', 'Protected dashboard actions require a signed-in workspace.'],
    },
    { title: 'Support channels', text: 'Use the contact page for general questions or email support for account-specific issues.' },
  ],
  cta: { label: 'Contact us', href: '/contact' },
}
