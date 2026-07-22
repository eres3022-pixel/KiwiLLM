import { acceptableUsePage } from './support/acceptableUse'
import { blogPage } from './support/blog'
import { changelogPage } from './support/changelog'
import { communityPage } from './support/community'
import { contactPage } from './support/contact'
import { cookiePolicyPage } from './support/cookiePolicy'
import { creatorProgramPage } from './support/creatorProgram'
import { githubPage } from './support/github'
import { linkedinPage } from './support/linkedin'
import { privacyPage } from './support/privacy'
import { roadmapPage } from './support/roadmap'
import { sdksPage } from './support/sdks'
import { securityPage } from './support/security'
import { statusPage } from './support/status'
import { supportPageContent } from './support/support'
import { termsPage } from './support/terms'

export type SupportPage = {
  title: string
  label: string
  eyebrow: string
  intro: string
  blocks: Array<{ title: string; text: string; items?: string[] }>
  cta?: { label: string; href: string }
}

export const supportPages: Record<string, SupportPage> = {
  '/privacy': privacyPage,
  '/terms': termsPage,
  '/security': securityPage,
  '/support': supportPageContent,
  '/contact': contactPage,
  '/creator-program': creatorProgramPage,
  '/sdks': sdksPage,
  '/blog': blogPage,
  '/cookie-policy': cookiePolicyPage,
  '/acceptable-use': acceptableUsePage,
  '/roadmap': roadmapPage,
  '/changelog': changelogPage,
  '/community': communityPage,
  '/github': githubPage,
  '/linkedin': linkedinPage,
}

export const pageNotFound: SupportPage = {
  title: 'Page not found - Kiwi LLM',
  label: 'Not found',
  eyebrow: '404',
  intro: 'This Kiwi page is not available yet. Use the navigation below to get back to a live production surface.',
  blocks: [{ title: 'Available pages', text: 'Docs, models, playground, top-up, dashboard, and the production policy pages are ready to browse.' }],
  cta: { label: 'Back home', href: '/' },
}

export const renderSupportPage = (page: SupportPage, pageHeader: string) => `
  <main class="content-page">
    ${pageHeader}
    <article class="content-shell content-shell-detailed">
      <div class="content-hero detailed-hero">
        <p class="section-kicker">${page.eyebrow}</p>
        <h1>${page.label}</h1>
        <p>${page.intro}</p>
        <small>Last updated: May 25, 2026</small>
      </div>

      <nav class="content-toc" aria-label="${page.label} table of contents">
        <h2>Table of Contents</h2>
        <ol>
          ${page.blocks.map((block) => `<li>${block.title}</li>`).join('')}
        </ol>
      </nav>

      <div class="content-detail-list">
        ${page.blocks
          .map(
            (block) => `
              <section>
                <h2>${block.title}</h2>
                <p>${block.text}</p>
                ${block.items ? `<ul>${block.items.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}
              </section>
            `,
          )
          .join('')}
      </div>
      <div class="content-actions">
        <a class="button button-primary" href="${page.cta?.href || '/dashboard'}">${page.cta?.label || 'Open dashboard'}</a>
        <a class="button button-ghost" href="/docs">Read docs</a>
      </div>
    </article>
  </main>
`
