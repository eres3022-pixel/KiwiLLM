import type { SupportPage } from '../supportPages'

export const linkedinPage: SupportPage = {
  title: 'LinkedIn - Kiwi LLM',
  label: 'LinkedIn',
  eyebrow: 'SOCIAL',
  intro: 'This page is the stable footer destination for LinkedIn until the official company profile is connected.',
  blocks: [
    { title: 'Company updates', text: 'Use LinkedIn for launch announcements, hiring posts, partnership updates, and longer company notes.' },
    { title: 'For now', text: 'Telegram and the blog are the best places to follow current Kiwi updates.' },
  ],
  cta: { label: 'Open blog', href: '/blog' },
}
