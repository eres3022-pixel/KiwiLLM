export const renderAccountPage = (pageHeader: string) => `
  <main class="dashboard-page account-page">
    ${pageHeader}

    <section class="dash-shell account-shell">
      <div class="dash-hero account-hero">
        <div class="account-hero-profile">
          <div class="account-avatar-large" id="account-avatar-hero">
            <span id="account-avatar-initials">K</span>
          </div>
          <div>
            <p class="section-kicker">USER PROFILE</p>
            <h1 id="account-hero-name">Account Settings</h1>
            <p id="account-hero-email">Manage your personal profile, avatar, credentials, and security preferences.</p>
          </div>
        </div>
      </div>

      <div class="account-grid">
        <!-- Edit Profile Panel -->
        <article class="dash-panel account-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Edit Profile</h2>
              <p>Update your display name and profile picture</p>
            </div>
          </div>
          <form class="account-form" id="account-profile-form">
            <div class="form-group">
              <label for="account-name-input">Full Name</label>
              <input id="account-name-input" type="text" placeholder="Your name" autocomplete="name" required />
            </div>

            <div class="form-group">
              <label for="account-avatar-input">Avatar Image URL</label>
              <div class="avatar-input-row" style="display: flex; gap: 12px; align-items: center;">
                <input id="account-avatar-input" type="url" placeholder="https://example.com/avatar.jpg" style="flex: 1;" />
                <div class="avatar-preview-small" id="account-avatar-preview-box" style="width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);">
                  <span id="account-avatar-preview-initial">K</span>
                </div>
              </div>
              <small style="color: var(--muted); font-size: 12px; margin-top: 4px; display: block;">Paste an image URL to set a custom profile avatar.</small>
            </div>

            <div class="form-group">
              <label for="account-email-input">Email Address</label>
              <input id="account-email-input" type="email" disabled readonly style="opacity: 0.7; cursor: not-allowed;" />
              <small style="color: var(--muted); font-size: 12px; margin-top: 4px; display: block;">Email address is verified and tied to your authentication account.</small>
            </div>

            <div id="profile-status-message" class="status-message" style="display: none; margin-top: 8px; font-size: 14px;"></div>

            <div class="form-actions" style="margin-top: 16px;">
              <button class="button button-primary" id="save-profile-btn" type="submit">Save Profile Changes</button>
            </div>
          </form>
        </article>

        <!-- Security & Password Panel -->
        <article class="dash-panel account-panel">
          <div class="dash-panel-head">
            <div>
              <h2>Security & Password</h2>
              <p>Update your authentication password</p>
            </div>
          </div>
          <form class="account-form" id="account-password-form">
            <div class="form-group">
              <label for="account-new-password">New Password</label>
              <input id="account-new-password" type="password" placeholder="At least 6 characters" minlength="6" required autocomplete="new-password" />
            </div>

            <div class="form-group">
              <label for="account-confirm-password">Confirm New Password</label>
              <input id="account-confirm-password" type="password" placeholder="Re-enter new password" minlength="6" required autocomplete="new-password" />
            </div>

            <div id="password-status-message" class="status-message" style="display: none; margin-top: 8px; font-size: 14px;"></div>

            <div class="form-actions" style="margin-top: 16px;">
              <button class="button button-primary" id="update-password-btn" type="submit">Update Password</button>
            </div>
          </form>

          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 28px 0 20px 0;" />

          <div class="account-info-box" style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
              <span style="color: var(--text-2);">Authentication Provider:</span>
              <strong style="color: #fff;" id="account-provider-badge">Supabase Auth</strong>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
              <span style="color: var(--text-2);">User ID (UUID):</span>
              <small style="color: var(--kiwi); font-family: monospace; font-size: 12px;" id="account-uuid-display">...</small>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
`
