import type { SupportPage } from '../supportPages'

export const creatorProgramPage: SupportPage = {
  title: 'Creator Program - Kiwi LLM',
  label: 'Creator Program',
  eyebrow: 'PROGRAMS',
  intro: 'The creator program is for builders, educators, and community leads who teach practical agent workflows with Kiwi.',
  blocks: [
    {
      title: 'What creators get',
      text: 'Approved creators can receive starter credits, tracked invite codes, early feature previews, and support for tutorials or workshops.',
      items: ['Custom redeem codes', 'Usage examples for common AI clients', 'Launch support for guides and videos'],
    },
    { title: 'Who should apply', text: 'Developers, AI educators, open-source maintainers, and community hosts with a real audience of builders.' },
    {
      title: 'Creator Responsibilities',
      text: 'Creators should publish accurate setup instructions, clearly disclose sponsored credits when applicable, and avoid promising model availability, pricing, or uptime beyond what Kiwi officially supports.',
    },
    {
      title: 'Invite Codes',
      text: 'Creator invite codes may include credit limits, expiration dates, redemption caps, and abuse controls. Kiwi may pause or revoke codes if they are shared outside the intended audience.',
    },
    {
      title: 'Review Process',
      text: 'Applications are reviewed based on audience fit, technical quality, content history, and whether the creator helps builders understand practical AI workflows.',
    },
  ],
  cta: { label: 'Contact us', href: '/contact' },
}
