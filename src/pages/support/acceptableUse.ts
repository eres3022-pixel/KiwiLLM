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
      {
        title: 'High-Risk Activity',
        text: 'Do not use Kiwi to generate or facilitate malware, credential theft, unauthorized surveillance, targeted harassment, spam, fraud, or instructions for evading safety systems.',
      },
      {
        title: 'Provider Policies',
        text: 'Because Kiwi routes to third-party providers, your usage must also comply with the policies that apply to the selected upstream model route.',
      },
      {
        title: 'Investigation',
        text: 'Kiwi may review usage metadata, request patterns, workspace ownership, payment risk, and support reports when investigating potential abuse.',
      },
    ],
  }
