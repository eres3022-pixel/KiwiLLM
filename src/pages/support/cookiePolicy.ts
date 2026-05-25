import type { SupportPage } from '../supportPages'

export const cookiePolicyPage: SupportPage = {
  title: 'Cookie Policy - Kiwi LLM',
  label: 'Cookie Policy',
  eyebrow: 'PRIVACY',
  intro: 'Kiwi uses essential browser storage for sessions, security, preferences, and product functionality.',
  blocks: [
    {
      title: 'What we store',
      text: 'Authentication sessions are handled by Supabase. The app may also store local UI preferences and playground presets in your browser.',
      items: ['Admin session tokens use session storage.', 'Playground presets use local storage.', 'Analytics or marketing cookies should be disclosed here before launch if added.'],
      },
      { title: 'Choices', text: 'You can clear browser storage at any time. Some authenticated features will require signing in again.' },
      {
        title: 'Essential Storage',
        text: 'Essential storage keeps authenticated sessions, admin session state, UI preferences, and draft playground data working. Disabling it may break sign-in or dashboard flows.',
      },
      {
        title: 'Analytics and Marketing',
        text: 'If Kiwi adds analytics, conversion tracking, or marketing pixels, this policy should be updated before launch to name the tools, purpose, retention period, and opt-out path.',
      },
      {
        title: 'Third Parties',
        text: 'Supabase, payment processors, and hosting providers may set their own cookies or storage entries as part of authentication, checkout, fraud prevention, or infrastructure security.',
      },
    ],
  }
