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
  ],
  cta: { label: 'Email support', href: 'mailto:support@kiwillm.in' },
}
