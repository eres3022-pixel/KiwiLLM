export const brandMark = '<img class="brand-logo" src="/kiwi-logo-192.png" alt="" />'

export const authAccountMarkup = (compact = false) => `
  <div class="auth-account ${compact ? 'auth-account-compact' : ''}" data-auth-account>
    <button class="auth-trigger" type="button" aria-haspopup="menu" aria-expanded="false" data-auth-open>
      <span class="auth-avatar auth-avatar-fallback" data-auth-avatar></span>
      <span class="auth-name" data-auth-name>${compact ? 'Account' : 'Sign in'}</span>
    </button>
    <div class="auth-menu" role="menu" data-auth-menu hidden>
      <a href="/dashboard" role="menuitem" data-auth-dashboard>Dashboard</a>
      <a href="/account" role="menuitem" data-auth-account-link>Account Settings</a>
      <button type="button" role="menuitem" data-auth-signout>Sign out</button>
    </div>
  </div>
`
