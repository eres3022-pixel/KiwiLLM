import type { SupportPage } from '../supportPages'

export const acceptableUsePage: SupportPage = {
  title: 'Acceptable Use - Kiwi LLM',
  label: 'Acceptable Use',
  eyebrow: 'POLICY',
  intro: 'Kiwi is built for legitimate development, automation, research, and production AI workloads.',
  blocks: [
    {
      title: 'Not allowed',
      text: 'Do not use Kiwi for illegal activity, credential theft, malware, spam, harassment, evading provider safety systems, or abusing upstream model networks.',
      items: ['Do not share or resell keys without permission.', 'Do not attempt to bypass rate limits or metering.', 'Do not send content that violates upstream provider policy.'],
    },
    { title: 'Enforcement', text: 'We may throttle, suspend, revoke keys, or close workspaces that create security, legal, billing, or provider-risk issues.' },
  ],
}
