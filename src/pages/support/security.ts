import type { SupportPage } from '../supportPages'

export const securityPage: SupportPage = {
  title: 'Security - Kiwi LLM',
  label: 'Security',
  eyebrow: 'SECURITY',
  intro: 'Kiwi is designed around short secrets, revocable keys, strict CORS, metered routing, and clear workspace controls.',
  blocks: [
    {
      title: 'Current safeguards',
      text: 'The API disables framework fingerprinting, sets common browser security headers, verifies Supabase sessions for protected actions, and stores key hashes for gateway authentication.',
      items: ['Use HTTPS in production.', 'Set explicit CORS origins.', 'Keep admin credentials and worker keys only in server env vars.'],
    },
    { title: 'Reporting', text: 'Send security reports with reproduction steps, affected endpoint, and impact. We prioritize issues affecting key leakage, auth bypass, credit abuse, or cross-workspace access.' },
  ],
}
