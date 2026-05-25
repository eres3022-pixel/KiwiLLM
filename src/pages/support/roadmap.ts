import type { SupportPage } from '../supportPages'

export const roadmapPage: SupportPage = {
  title: 'Roadmap - Kiwi LLM',
  label: 'Roadmap',
  eyebrow: 'ROADMAP',
  intro: 'The next production milestones focus on payments, monitoring, workspace controls, and deeper client integrations.',
  blocks: [
    {
      title: 'Near term',
      text: 'Wire live top-ups, add account-level billing history, publish status monitoring, and expand model route metadata.',
      items: ['Card and UPI checkout', 'USDT payment confirmation', 'Per-key budget controls', 'Public incident history'],
      },
      { title: 'Later', text: 'Team invites, route policies, custom providers, webhooks, and organization audit exports.' },
      {
        title: 'Reliability',
        text: 'Reliability work includes public status reporting, request tracing, provider fallback rules, retry controls, and clearer dashboard signals when upstream routes degrade.',
      },
      {
        title: 'Workspace Controls',
        text: 'Planned workspace controls include role-based access, per-key budgets, spend alerts, invite flows, usage exports, and team-level audit logs.',
      },
      {
        title: 'Developer Experience',
        text: 'Developer work includes SDK examples, client-specific setup guides, model route metadata, copyable configuration snippets, and webhook documentation.',
      },
    ],
  }
