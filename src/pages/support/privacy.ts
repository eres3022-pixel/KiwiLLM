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
    {
      title: 'How We Use Data',
      text: 'Kiwi uses this information to authenticate users, route API requests, meter usage, prevent abuse, display dashboard history, issue credits, and support production incidents.',
      items: ['Usage totals help calculate credit consumption.', 'Audit events help investigate admin and billing actions.', 'Support metadata helps resolve account-specific requests.'],
    },
    {
      title: 'Sharing and Providers',
      text: 'When you send an API request through Kiwi, request content may be transmitted to the selected upstream model provider so the provider can generate a response. Provider handling is governed by the selected provider route and applicable provider terms.',
      items: ['Kiwi does not sell workspace data.', 'Payment processors may receive billing details needed to complete transactions.', 'Legal or safety disclosures may occur when required by law.'],
    },
    {
      title: 'Retention',
      text: 'Kiwi keeps account, usage, billing, and audit records for as long as needed to operate the service, satisfy legal obligations, resolve disputes, and enforce agreements.',
      items: ['Revoked key previews and hashes may remain in audit records.', 'Playground run history may be stored until deleted or rotated.', 'Operational logs may be retained for security and reliability review.'],
    },
    { title: 'Control', text: 'Workspace owners can revoke keys, rotate credentials, and request account or usage export through support channels.' },
  ],
}
