import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let doctorsList = [];
let departmentsList = [];

export const renderDoctors = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Doctor management</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Manage medical specialists and schedules</p>
      </div>
      <button id="add-doctor-btn" class="btn btn-primary">
        <i data-lucide="plus"></i>Add doctor profile
      </button>
    </div>

    <!-- Doctors Table Container -->
    <div id="doctors-table-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Fetching doctors...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  document.getElementById('add-doctor-btn').addEventListener('click', () => openDoctorModal());

  await fetchDoctors();
  await fetchDepartments();
};

const fetchDoctors = async () => {
  const container = document.getElementById('doctors-table-container');
  if (!container) return;

  const res = await fetchAPI('/doctors');
  if (res.success) {
    doctorsList = res.data;
  } else {
    doctorsList = getMockDoctors();
  }

  renderDoctorsTable(doctorsList);
};

const fetchDepartments = async () => {
  const res = await fetchAPI('/doctors/departments'); // We'll make this API endpoint
  if (res.success) {
    departmentsList = res.data;
  } else {
    departmentsList = [
      { _id: 'cardiology_id', name: 'Cardiology' },
      { _id: 'pediatrics_id', name: 'Pediatrics' }
    ];
  }
};

const renderDoctorsTable = (list) => {
  const container = document.getElementById('doctors-table-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="user-cog" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No doctors configured</h3>
        <p class="empty-state-desc">There are no doctors registered in the database.</p>
        <button onclick="document.getElementById('add-doctor-btn').click()" class="btn btn-primary">Add doctor profile</button>
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
            <th>Specialization</th>
            <th>Department</th>
            <th>Fee</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(d => `
            <tr>
              <td style="font-weight: 600; color: var(--primary);">${d.user?.name || d.name}</td>
              <td>${d.user?.email || d.email}</td>
              <td>${d.specialization}</td>
              <td>${d.department?.name || 'General'}</td>
              <td>$${d.consultationFee}</td>
              <td>Mon, Wed, Fri</td>
              <td>
                <button class="btn btn-secondary btn-sm edit-doc-btn" data-id="${d._id}" style="padding: 4px 8px; font-size: 0.8rem;">Edit</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.edit-doc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const doctor = doctorsList.find(d => d._id === id);
      if (doctor) openDoctorModal(doctor);
    });
  });
};

const openDoctorModal = (doctor = null) => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = doctor ? 'Edit doctor profile' : 'Add doctor profile';
  submitBtn.innerText = doctor ? 'Update doctor' : 'Save doctor';

  body.innerHTML = `
    <form id="modal-doctor-form">
      <div class="form-group">
        <label class="form-label">Full name</label>
        <input type="text" id="modal-doc-name" class="form-input" value="${doctor?.user?.name || doctor?.name || ''}" required ${doctor ? 'disabled' : ''}>
      </div>
      <div class="form-group">
        <label class="form-label">Email address</label>
        <input type="email" id="modal-doc-email" class="form-input" value="${doctor?.user?.email || doctor?.email || ''}" required ${doctor ? 'disabled' : ''}>
      </div>
      ${doctor ? '' : `
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="modal-doc-password" class="form-input" required>
        </div>
      `}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Specialization</label>
          <input type="text" id="modal-doc-spec" class="form-input" value="${doctor?.specialization || ''}" required placeholder="e.g. Cardiologist">
        </div>
        <div class="form-group">
          <label class="form-label">Department</label>
          <select id="modal-doc-dept" class="form-input" required>
            ${departmentsList.map(dept => `
              <option value="${dept._id}" ${doctor?.department?._id === dept._id || doctor?.department === dept._id ? 'selected' : ''}>${dept.name}</option>
            `).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Qualifications</label>
        <input type="text" id="modal-doc-qual" class="form-input" value="${doctor?.qualifications || ''}" required placeholder="e.g. MD Johns Hopkins">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Consultation fee ($)</label>
          <input type="number" id="modal-doc-fee" class="form-input" value="${doctor?.consultationFee || 100}" required min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Phone number</label>
          <input type="tel" id="modal-doc-phone" class="form-input" value="${doctor?.user?.phone || doctor?.phone || ''}">
        </div>
      </div>
    </form>
  `;

  modal.classList.add('open');

  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-doctor-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      name: document.getElementById('modal-doc-name').value.trim(),
      email: document.getElementById('modal-doc-email').value.trim(),
      specialization: document.getElementById('modal-doc-spec').value.trim(),
      department: document.getElementById('modal-doc-dept').value,
      qualifications: document.getElementById('modal-doc-qual').value.trim(),
      consultationFee: parseFloat(document.getElementById('modal-doc-fee').value),
      phone: document.getElementById('modal-doc-phone').value.trim()
    };

    if (!doctor) {
      payload.password = document.getElementById('modal-doc-password').value;
    }

    submitBtn.disabled = true;
    let res;
    if (doctor) {
      res = await fetchAPI(`/doctors/${doctor._id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetchAPI('/doctors', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    if (res.success) {
      closeModal();
      await fetchDoctors();
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Operation failed');
    }
  };
};

const getMockDoctors = () => [
  { _id: 'doctor1', specialization: 'Diagnostic Medicine & Cardiology', qualifications: 'MD from Johns Hopkins University', consultationFee: 150, user: { name: 'Dr. Gregory House', email: 'doctor@medcareplus.com' }, department: { name: 'Cardiology' } }
];
