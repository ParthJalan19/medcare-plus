import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let patientsList = [];

export const renderPatients = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Patient directory</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Manage and register patient details</p>
      </div>
      <button id="add-patient-btn" class="btn btn-primary">
        <i data-lucide="plus"></i>Register patient
      </button>
    </div>

    <!-- Filters Bar -->
    <div style="background-color: var(--bg-primary); border: var(--border-hairline); border-radius: var(--radius-md); padding: var(--space-md); margin-bottom: var(--space-lg); display: flex; gap: var(--space-md); flex-wrap: wrap; align-items: center;">
      <div style="flex-grow: 1; min-width: 200px; position: relative;">
        <input type="text" id="patient-search" placeholder="Search patients by name or phone..." class="form-input" style="padding-left: 36px;">
        <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted);"></i>
      </div>
      <div style="width: 150px;">
        <select id="filter-gender" class="form-input">
          <option value="">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div style="width: 150px;">
        <select id="filter-blood" class="form-input">
          <option value="">All blood groups</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>
    </div>

    <!-- Patients List Mount -->
    <div id="patients-table-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Fetching patients...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach Event Listeners
  document.getElementById('add-patient-btn').addEventListener('click', () => openPatientModal());
  document.getElementById('patient-search').addEventListener('input', filterAndRenderPatients);
  document.getElementById('filter-gender').addEventListener('change', filterAndRenderPatients);
  document.getElementById('filter-blood').addEventListener('change', filterAndRenderPatients);

  // Fetch Patients List
  await fetchPatients();
};

const fetchPatients = async () => {
  const container = document.getElementById('patients-table-container');
  if (!container) return;

  const res = await fetchAPI('/patients');
  if (res.success) {
    patientsList = res.data;
  } else {
    console.warn('Patients fetch failed, using fallback seed list.');
    patientsList = getMockPatients();
  }

  renderPatientsTable(patientsList);
};

const renderPatientsTable = (list) => {
  const container = document.getElementById('patients-table-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="users" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No patients registered</h3>
        <p class="empty-state-desc">There are no patient records matching your filters.</p>
        <button onclick="document.getElementById('add-patient-btn').click()" class="btn btn-primary">Register patient</button>
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
            <th>Date of Birth</th>
            <th>Gender</th>
            <th>Blood Group</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(p => `
            <tr>
              <td style="font-weight: 600; color: var(--primary);">${p.name}</td>
              <td>${new Date(p.DOB).toLocaleDateString()}</td>
              <td style="text-transform: capitalize;">${p.gender}</td>
              <td><span class="badge badge-success" style="background-color: var(--primary-light); color: var(--primary);">${p.bloodGroup || 'Unknown'}</span></td>
              <td>${p.contact}</td>
              <td>${p.address || '-'}</td>
              <td>
                <button class="btn btn-secondary btn-sm edit-pat-btn" data-id="${p._id}" style="padding: 4px 8px; font-size: 0.8rem;">Edit</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach Edit actions
  container.querySelectorAll('.edit-pat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const patient = patientsList.find(p => p._id === id);
      if (patient) openPatientModal(patient);
    });
  });
};

const filterAndRenderPatients = () => {
  const searchVal = document.getElementById('patient-search').value.toLowerCase().trim();
  const genderVal = document.getElementById('filter-gender').value;
  const bloodVal = document.getElementById('filter-blood').value;

  const filtered = patientsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.contact.includes(searchVal);
    const matchesGender = !genderVal || p.gender === genderVal;
    const matchesBlood = !bloodVal || p.bloodGroup === bloodVal;
    return matchesSearch && matchesGender && matchesBlood;
  });

  renderPatientsTable(filtered);
};

// MODAL CONTROLS
const openPatientModal = (patient = null) => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = patient ? 'Edit patient details' : 'Register new patient';
  submitBtn.innerText = patient ? 'Update patient' : 'Save patient';

  body.innerHTML = `
    <form id="modal-patient-form">
      <div class="form-group">
        <label class="form-label">Full name</label>
        <input type="text" id="modal-pat-name" class="form-input" value="${patient?.name || ''}" required>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Date of birth</label>
          <input type="date" id="modal-pat-dob" class="form-input" value="${patient?.DOB ? new Date(patient.DOB).toISOString().split('T')[0] : ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">Gender</label>
          <select id="modal-pat-gender" class="form-input" required>
            <option value="male" ${patient?.gender === 'male' ? 'selected' : ''}>Male</option>
            <option value="female" ${patient?.gender === 'female' ? 'selected' : ''}>Female</option>
            <option value="other" ${patient?.gender === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Blood group</label>
          <select id="modal-pat-blood" class="form-input">
            <option value="unknown" ${patient?.bloodGroup === 'unknown' ? 'selected' : ''}>Unknown</option>
            <option value="A+" ${patient?.bloodGroup === 'A+' ? 'selected' : ''}>A+</option>
            <option value="A-" ${patient?.bloodGroup === 'A-' ? 'selected' : ''}>A-</option>
            <option value="B+" ${patient?.bloodGroup === 'B+' ? 'selected' : ''}>B+</option>
            <option value="B-" ${patient?.bloodGroup === 'B-' ? 'selected' : ''}>B-</option>
            <option value="AB+" ${patient?.bloodGroup === 'AB+' ? 'selected' : ''}>AB+</option>
            <option value="AB-" ${patient?.bloodGroup === 'AB-' ? 'selected' : ''}>AB-</option>
            <option value="O+" ${patient?.bloodGroup === 'O+' ? 'selected' : ''}>O+</option>
            <option value="O-" ${patient?.bloodGroup === 'O-' ? 'selected' : ''}>O-</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Contact number</label>
          <input type="tel" id="modal-pat-contact" class="form-input" value="${patient?.contact || ''}" required>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <input type="text" id="modal-pat-address" class="form-input" value="${patient?.address || ''}">
      </div>
      <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Emergency contact info</label>
          <input type="text" id="modal-pat-emergency" class="form-input" value="${patient?.emergencyContact || ''}" placeholder="Name (Relationship) - Phone">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Allergies (comma separated)</label>
        <input type="text" id="modal-pat-allergies" class="form-input" value="${patient?.allergies ? patient.allergies.join(', ') : ''}" placeholder="e.g. Penicillin, Peanuts">
      </div>
    </form>
  `;

  modal.classList.add('open');

  const closeModal = () => modal.classList.remove('open');

  // Cancel Event
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  // Submit Event
  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-patient-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      name: document.getElementById('modal-pat-name').value.trim(),
      DOB: document.getElementById('modal-pat-dob').value,
      gender: document.getElementById('modal-pat-gender').value,
      bloodGroup: document.getElementById('modal-pat-blood').value,
      contact: document.getElementById('modal-pat-contact').value.trim(),
      address: document.getElementById('modal-pat-address').value.trim(),
      emergencyContact: document.getElementById('modal-pat-emergency').value.trim(),
      allergies: document.getElementById('modal-pat-allergies').value
        .split(',')
        .map(x => x.trim())
        .filter(x => x !== '')
    };

    submitBtn.disabled = true;
    let res;
    if (patient) {
      // Update patient
      res = await fetchAPI(`/patients/${patient._id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
    } else {
      // Create patient
      res = await fetchAPI('/patients', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    if (res.success) {
      closeModal();
      await fetchPatients();
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Operation failed');
    }
  };
};

const getMockPatients = () => [
  { _id: '1', name: 'John Doe', DOB: new Date('1985-05-15'), gender: 'male', bloodGroup: 'O+', contact: '123-456-7896', address: '742 Evergreen Terrace' },
  { _id: '2', name: 'Alice Smith', DOB: new Date('1992-09-20'), gender: 'female', bloodGroup: 'A-', contact: '555-019-2834', address: '12 Bluebell Lane' },
  { _id: '3', name: 'Tommy Shelby', DOB: new Date('1978-11-01'), gender: 'male', bloodGroup: 'AB+', contact: '555-021-9382', address: 'Watery Lane, Birmingham' }
];
