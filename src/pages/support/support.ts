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
    {
      title: 'API Request Issues',
      text: 'For failed model calls, include the endpoint, model id, timestamp, response status, request id if available, and whether the same key works against /v1/models.',
      items: ['Do not include full API keys.', 'Share only the key preview or workspace email.', 'Include upstream error text if visible.'],
    },
    {
      title: 'Billing and Credits',
      text: 'For credit or billing issues, include payment reference, dashboard balance before and after the event, and screenshots of the relevant transaction or error.',
    },
    {
      title: 'Expected Response Times',
      text: 'Production-impacting auth, billing, and routing issues are handled first. General setup questions and feature requests may take longer during launch periods.',
    },
  ],
  cta: { label: 'Contact us', href: '/contact' },
}
