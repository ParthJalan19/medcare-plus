import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let staffList = [];

export const renderStaff = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Staff directory</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Manage hospital personnel accounts and system access</p>
      </div>
      <button id="add-staff-btn" class="btn btn-primary">
        <i data-lucide="user-plus"></i>Add staff member
      </button>
    </div>

    <!-- Staff Table Container -->
    <div id="staff-table-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading staff directory...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  document.getElementById('add-staff-btn').addEventListener('click', () => openStaffModal());

  await fetchStaff();
};

const fetchStaff = async () => {
  const container = document.getElementById('staff-table-container');
  if (!container) return;

  const res = await fetchAPI('/staff');
  if (res.success) {
    staffList = res.data;
  } else {
    staffList = getMockStaff();
  }

  renderStaffTable(staffList);
};

const renderStaffTable = (list) => {
  const container = document.getElementById('staff-table-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="shield" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No staff registered</h3>
        <p class="empty-state-desc">There are no administrative or clinical staff members registered.</p>
        <button onclick="document.getElementById('add-staff-btn').click()" class="btn btn-primary">Add staff member</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="panel-card table-responsive" style="padding: 0;">
      <table class="med-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(s => `
            <tr>
              <td style="font-weight: 600; color: var(--primary);">${s.name}</td>
              <td>${s.email}</td>
              <td style="text-transform: capitalize;">${s.role}</td>
              <td>${s.phone || '-'}</td>
              <td>
                <span class="badge badge-${s.isActive ? 'success' : 'danger'}">${s.isActive ? 'Active' : 'Deactivated'}</span>
              </td>
              <td>
                <button class="btn btn-secondary btn-sm toggle-status-btn" data-id="${s._id}" data-active="${s.isActive}" style="padding: 4px 8px; font-size: 0.8rem;">
                  ${s.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach status toggle actions
  container.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const currentActive = e.target.getAttribute('data-active') === 'true';
      
      const res = await fetchAPI(`/staff/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !currentActive })
      });

      if (res.success) {
        await fetchStaff();
      } else {
        alert(res.error || 'Failed to update user access.');
      }
    });
  });
};

const openStaffModal = () => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Add hospital staff member';
  submitBtn.innerText = 'Save staff member';

  body.innerHTML = `
    <form id="modal-staff-form">
      <div class="form-group">
        <label class="form-label">Full name</label>
        <input type="text" id="modal-staff-name" class="form-input" required placeholder="e.g. Pam Beesly">
      </div>
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input type="email" id="modal-staff-email" class="form-input" required placeholder="email@hospital.com">
      </div>
      <div class="form-group">
        <label class="form-label">Temporary password</label>
        <input type="password" id="modal-staff-pass" class="form-input" required placeholder="Min. 6 characters">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Role</label>
          <select id="modal-staff-role" class="form-input" required>
            <option value="receptionist">Receptionist</option>
            <option value="nurse">Nurse</option>
            <option value="lab">Laboratory Staff</option>
            <option value="pharmacist">Pharmacist</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Phone number</label>
          <input type="tel" id="modal-staff-phone" class="form-input" placeholder="123-456-7890">
        </div>
      </div>
    </form>
  `;

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-staff-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      name: document.getElementById('modal-staff-name').value.trim(),
      email: document.getElementById('modal-staff-email').value.trim(),
      password: document.getElementById('modal-staff-pass').value,
      role: document.getElementById('modal-staff-role').value,
      phone: document.getElementById('modal-staff-phone').value.trim()
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/staff', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      await fetchStaff();
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to save staff account.');
    }
  };
};

const getMockStaff = () => [
  { _id: 's1', name: 'Pam Beesly', email: 'receptionist@medcareplus.com', role: 'receptionist', phone: '123-456-7892', isActive: true },
  { _id: 's2', name: 'Florence Nightingale', email: 'nurse@medcareplus.com', role: 'nurse', phone: '123-456-7893', isActive: true },
  { _id: 's3', name: 'Barry Allen', email: 'lab@medcareplus.com', role: 'lab', phone: '123-456-7894', isActive: true }
];
