import type { SupportPage } from '../supportPages'

export const linkedinPage: SupportPage = {
  title: 'LinkedIn - Kiwi LLM',
  label: 'LinkedIn',
  eyebrow: 'SOCIAL',
  intro: 'This page is the stable footer destination for LinkedIn until the official company profile is connected.',
    blocks: [
      { title: 'Company updates', text: 'Use LinkedIn for launch announcements, hiring posts, partnership updates, and longer company notes.' },
      { title: 'For now', text: 'Telegram and the blog are the best places to follow current Kiwi updates.' },
      {
        title: 'What We Share',
        text: 'LinkedIn updates should focus on product milestones, customer stories, provider partnerships, creator program announcements, and practical AI infrastructure lessons.',
      },
      {
        title: 'Business Inquiries',
        text: 'Teams evaluating Kiwi for production should use the contact page with expected traffic, region, billing requirements, and preferred model families.',
      },
      {
        title: 'Hiring and Partners',
        text: 'Future hiring, advisor, or provider partnership posts can link back here once the official company page is connected.',
      },
    ],
  cta: { label: 'Open blog', href: '/blog' },
}
