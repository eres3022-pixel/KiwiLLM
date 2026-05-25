import type { SupportPage } from '../supportPages'

export const privacyPage: SupportPage = {
  title: 'Privacy - Kiwi LLM',
  label: 'Privacy',
  eyebrow: 'TRUST',
  intro: 'Kiwi keeps workspace, auth, usage, and billing data limited to what is needed to run the gateway and support your account.',
  blocks: [
    {
      title: 'Data we use',
      text: 'We store account identity, workspace metadata, API key previews, credit balances, request usage, and operational logs needed for routing, metering, fraud prevention, and support.',
      items: [
        'We never show full API keys after creation.',
        'Prompts and responses are only retained for features that need history, such as playground runs.',
        'Payment records should live with the payment provider, not inside the public app.',
      ],
    },
    { title: 'Control', text: 'Workspace owners can revoke keys, rotate credentials, and request account or usage export through support channels.' },
  ],
}
