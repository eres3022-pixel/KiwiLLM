import type { SupportPage } from '../supportPages'

export const contactPage: SupportPage = {
  title: 'Contact - Kiwi LLM',
  label: 'Contact Us',
  eyebrow: 'CONTACT',
  intro: 'Reach Kiwi for partnerships, account help, billing questions, production onboarding, or model route requests.',
  blocks: [
    {
      title: 'Email support',
      text: 'For account-specific help, include your workspace email, affected endpoint, approximate request time, and any error code shown in the dashboard.',
      items: ['support@kiwillm.in', 'Response priority goes to billing, auth, and production routing issues.', 'Never send full API keys in support messages.'],
    },
    { title: 'Partnerships', text: 'For provider partnerships, creator launches, or custom model routes, include expected traffic, regions, and target clients.' },
    {
      title: 'Sales and Onboarding',
      text: 'Teams planning production usage should include expected monthly requests, preferred model families, latency requirements, compliance needs, and billing region.',
    },
    {
      title: 'Security Contact',
      text: 'For suspected vulnerabilities, credential exposure, or abuse reports, use security@kiwillm.in and include enough detail for reproduction and impact assessment.',
    },
    {
      title: 'What Not To Send',
      text: 'Never send full Kiwi API keys, Supabase tokens, database passwords, private model provider keys, or customer personal data in ordinary support messages.',
    },
  ],
  cta: { label: 'Email support', href: 'mailto:support@kiwillm.in' },
}
