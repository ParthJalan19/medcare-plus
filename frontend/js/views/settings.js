import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

export const renderSettings = async (mountTarget) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Account settings</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Manage your security preferences and profile details</p>
      </div>
    </div>

    <div class="panels-grid" style="grid-template-columns: 1.5fr 1fr;">
      <!-- Profile Information Card -->
      <div class="panel-card">
        <h3 class="panel-title" style="margin-bottom: var(--space-md); border-bottom: var(--border-hairline); padding-bottom: var(--space-xs);">My profile</h3>
        
        <div style="display: flex; gap: var(--space-md); align-items: center; margin-bottom: var(--space-lg);">
          <img id="settings-avatar-preview" src="${userInfo.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=120'}" alt="avatar" class="avatar" style="width: 80px; height: 80px; border-radius: 50%;">
          <div>
            <form id="avatar-upload-form" enctype="multipart/form-data">
              <input type="file" id="settings-avatar-file" accept="image/jpeg,image/png" style="display: none;">
              <button type="button" id="upload-avatar-trigger-btn" class="btn btn-secondary btn-sm" style="margin-bottom: 6px;">Upload new photo</button>
            </form>
            <p style="font-size: 0.75rem; color: var(--text-secondary);">JPG or PNG, max size 5MB.</p>
          </div>
        </div>

        <form id="settings-profile-form">
          <div class="form-group">
            <label class="form-label">Full name</label>
            <input type="text" id="settings-name" class="form-input" value="${userInfo.name || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" id="settings-email" class="form-input" value="${userInfo.email || ''}" required disabled>
          </div>
          <div class="form-group">
            <label class="form-label">Phone number</label>
            <input type="tel" id="settings-phone" class="form-input" value="${userInfo.phone || ''}">
          </div>
          <button type="submit" id="settings-profile-submit" class="btn btn-primary">Save changes</button>
        </form>
      </div>

      <!-- Security / Change Password -->
      <div class="panel-card">
        <h3 class="panel-title" style="margin-bottom: var(--space-md); border-bottom: var(--border-hairline); padding-bottom: var(--space-xs);">Security</h3>
        
        <form id="settings-password-form">
          <div class="form-group">
            <label class="form-label">Current password</label>
            <input type="password" id="settings-old-pass" class="form-input" required placeholder="••••••••">
          </div>
          <div class="form-group">
            <label class="form-label">New password</label>
            <input type="password" id="settings-new-pass" class="form-input" required placeholder="Min. 6 characters">
          </div>
          <div class="form-group">
            <label class="form-label">Confirm new password</label>
            <input type="password" id="settings-confirm-pass" class="form-input" required placeholder="Repeat new password">
          </div>
          <button type="submit" id="settings-password-submit" class="btn btn-primary">Update credentials</button>
        </form>
      </div>
    </div>
  `;

  // Avatar Upload trigger
  const triggerBtn = document.getElementById('upload-avatar-trigger-btn');
  const fileInput = document.getElementById('settings-avatar-file');
  
  if (triggerBtn && fileInput) {
    triggerBtn.onclick = () => fileInput.click();
    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('avatar', file);

      triggerBtn.disabled = true;
      triggerBtn.innerText = 'Uploading...';

      const token = localStorage.getItem('accessToken');
      try {
        const uploadRes = await fetch('/api/v1/auth/avatar', { // We'll make this API endpoint
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        const res = await uploadRes.json();
        if (res.success) {
          userInfo.avatar = res.data.avatar;
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
          document.getElementById('settings-avatar-preview').src = res.data.avatar;
          document.getElementById('topbar-avatar').src = res.data.avatar;
          document.getElementById('sidebar-avatar').src = res.data.avatar;
          alert('Profile photo updated.');
        } else {
          alert(res.error || 'Failed to upload photo.');
        }
      } catch (err) {
        console.error(err);
        alert('Network upload failed.');
      } finally {
        triggerBtn.disabled = false;
        triggerBtn.innerText = 'Upload new photo';
      }
    };
  }

  // Profile Details Form Submission
  const profileForm = document.getElementById('settings-profile-form');
  profileForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('settings-name').value.trim();
    const phone = document.getElementById('settings-phone').value.trim();

    const submitBtn = document.getElementById('settings-profile-submit');
    submitBtn.disabled = true;

    const res = await fetchAPI('/auth/update-profile', { // We'll make this API endpoint
      method: 'PATCH',
      body: JSON.stringify({ name, phone })
    });

    submitBtn.disabled = false;

    if (res.success) {
      userInfo.name = name;
      userInfo.phone = phone;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      document.getElementById('sidebar-username').innerText = name;
      alert('Profile updated successfully.');
    } else {
      alert(res.error || 'Failed to save changes.');
    }
  };

  // Password Form Submission
  const passwordForm = document.getElementById('settings-password-form');
  passwordForm.onsubmit = async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('settings-old-pass').value;
    const newPassword = document.getElementById('settings-new-pass').value;
    const confirm = document.getElementById('settings-confirm-pass').value;

    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirm) {
      alert('Passwords do not match.');
      return;
    }

    const submitBtn = document.getElementById('settings-password-submit');
    submitBtn.disabled = true;

    const res = await fetchAPI('/auth/update-password', { // We'll make this API endpoint
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    submitBtn.disabled = false;

    if (res.success) {
      passwordForm.reset();
      alert('Password updated successfully.');
    } else {
      alert(res.error || 'Failed to update password.');
    }
  };
};
