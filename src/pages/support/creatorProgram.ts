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
  ],
  cta: { label: 'Contact us', href: '/contact' },
}
