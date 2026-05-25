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
  ],
}
