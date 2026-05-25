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
      {
        title: 'Credential Handling',
        text: 'Kiwi API keys are designed to be revocable. Full key material should only be shown at creation time and should never be sent through screenshots, public issue trackers, or support chats.',
        items: ['Store keys in environment variables or secret managers.', 'Use separate keys for local development and production.', 'Revoke keys immediately after suspected exposure.'],
      },
      {
        title: 'Production Checklist',
        text: 'Before running production traffic, configure HTTPS, explicit CORS origins, Supabase authentication, strong admin credentials, database backups, and monitoring for /api/health and /api/ready.',
      },
      {
        title: 'Response Process',
        text: 'Security reports are triaged by severity. Issues involving auth bypass, cross-workspace access, key exposure, or credit abuse receive the highest priority.',
      },
    ],
  }
