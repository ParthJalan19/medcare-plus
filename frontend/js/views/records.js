import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let medicalRecords = [];
let prescriptionsList = [];

export const renderRecords = async (mountTarget) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isDoctor = userInfo.role === 'doctor' || userInfo.role === 'admin';
  const isPatient = userInfo.role === 'patient';

  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Electronic medical records (EMR)</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Access patient history, diagnoses, and prescriptions</p>
      </div>
      ${isDoctor ? `
        <div style="display: flex; gap: var(--space-xs);">
          <button id="add-record-btn" class="btn btn-secondary"><i data-lucide="plus"></i>Add EMR record</button>
          <button id="add-presc-btn" class="btn btn-primary"><i data-lucide="file-plus"></i>Issue prescription</button>
        </div>
      ` : ''}
    </div>

    <!-- Tabs Header -->
    <div style="border-bottom: 2px solid var(--border-color); display: flex; gap: var(--space-lg); margin-bottom: var(--space-lg);">
      <button id="tab-history" class="btn btn-secondary" style="border-radius: 0; background: none; border-bottom: 2px solid var(--primary); color: var(--primary); padding: 8px 16px; font-weight: 600;">Clinical history</button>
      <button id="tab-prescriptions" class="btn btn-secondary" style="border-radius: 0; background: none; color: var(--text-secondary); padding: 8px 16px;">Prescriptions</button>
    </div>

    <!-- Tab Contents Mount -->
    <div id="tab-content-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Fetching clinical records...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach tabs events
  const tabHistory = document.getElementById('tab-history');
  const tabPresc = document.getElementById('tab-prescriptions');
  
  tabHistory.onclick = () => {
    tabHistory.style.borderBottom = '2px solid var(--primary)';
    tabHistory.style.color = 'var(--primary)';
    tabPresc.style.borderBottom = 'none';
    tabPresc.style.color = 'var(--text-secondary)';
    renderClinicalHistoryTab(isDoctor, isPatient);
  };

  tabPresc.onclick = () => {
    tabPresc.style.borderBottom = '2px solid var(--primary)';
    tabPresc.style.color = 'var(--primary)';
    tabHistory.style.borderBottom = 'none';
    tabHistory.style.color = 'var(--text-secondary)';
    renderPrescriptionsTab(isDoctor, isPatient);
  };

  if (isDoctor) {
    document.getElementById('add-record-btn').addEventListener('click', () => openRecordModal());
    document.getElementById('add-presc-btn').addEventListener('click', () => openPrescriptionModal());
  }

  // Load first tab initially
  await fetchMedicalRecords(isPatient);
  renderClinicalHistoryTab(isDoctor, isPatient);
};

const fetchMedicalRecords = async (isPatient) => {
  const endpoint = isPatient ? '/medical-records/my-records' : '/medical-records';
  const res = await fetchAPI(endpoint);
  if (res.success) {
    medicalRecords = res.data;
  } else {
    medicalRecords = getMockRecords();
  }
};

const renderClinicalHistoryTab = (isDoctor, isPatient) => {
  const container = document.getElementById('tab-content-container');
  if (!container) return;

  if (medicalRecords.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="file-text" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No history found</h3>
        <p class="empty-state-desc">There are no diagnostic records in this account.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: var(--space-md);">
      ${medicalRecords.map(rec => `
        <div class="panel-card" style="position: relative;">
          <div style="display: flex; justify-content: space-between; border-bottom: var(--border-hairline); padding-bottom: var(--space-sm); margin-bottom: var(--space-sm);">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Visit Date: ${new Date(rec.visitDate || rec.createdAt).toLocaleDateString()}</span>
              <h4 style="margin-top: 4px; font-weight: 600; color: var(--primary);">${isPatient ? 'Consultation Record' : rec.patient?.name}</h4>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; font-weight: 500; display: block;">Attending Physician: ${rec.doctor?.user?.name || 'Dr. House'}</span>
            </div>
          </div>
          <div style="margin-bottom: var(--space-sm);">
            <strong style="font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 2px;">Diagnosis</strong>
            <p style="font-size: 0.95rem;">${rec.diagnosis}</p>
          </div>
          <div>
            <strong style="font-size: 0.85rem; color: var(--text-secondary); display: block; margin-bottom: 2px;">Treatment & Recommendations</strong>
            <p style="font-size: 0.9rem; color: var(--text-secondary);">${rec.treatment}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
};

const renderPrescriptionsTab = async (isDoctor, isPatient) => {
  const container = document.getElementById('tab-content-container');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Fetching prescriptions...</p>
    </div>
  `;

  const endpoint = isPatient ? '/prescriptions/my-prescriptions' : '/prescriptions';
  const res = await fetchAPI(endpoint);
  if (res.success) {
    prescriptionsList = res.data;
  } else {
    prescriptionsList = getMockPrescriptions();
  }

  if (prescriptionsList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="pill" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No prescriptions found</h3>
        <p class="empty-state-desc">There are no pharmacy order sheets registered.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: var(--space-md);">
      ${prescriptionsList.map(presc => `
        <div class="panel-card">
          <div style="display: flex; justify-content: space-between; border-bottom: var(--border-hairline); padding-bottom: var(--space-sm); margin-bottom: var(--space-sm);">
            <div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Issued: ${new Date(presc.issuedDate).toLocaleDateString()}</span>
              <h4 style="margin-top: 4px; font-weight: 600; color: var(--primary);">${isPatient ? 'Prescription Slip' : presc.patient?.name}</h4>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.8rem; font-weight: 500;">By: ${presc.doctor?.user?.name || 'Dr. House'}</span>
            </div>
          </div>
          
          <table class="med-table" style="margin-top: var(--space-sm);">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${presc.medicines.map(med => `
                <tr>
                  <td style="font-weight: 600;">${med.name}</td>
                  <td>${med.dosage}</td>
                  <td>${med.duration}</td>
                  <td>${med.instructions}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `).join('')}
    </div>
  `;
};

// MODALS FOR DIAGNOSIS & PRESCRIPTIONS
const openRecordModal = () => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Add EMR record';
  submitBtn.innerText = 'Save diagnosis';

  body.innerHTML = `
    <form id="modal-emr-form">
      <div class="form-group">
        <label class="form-label">Patient</label>
        <select id="modal-emr-patient" class="form-input" required>
          <!-- Will fetch and render patients dynamically in Milestone 4 -->
          <option value="">Select patient</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Diagnosis</label>
        <textarea id="modal-emr-diag" class="form-input" style="height: 100px; resize: none;" required placeholder="Describe condition (e.g. Mild arrhythmias, Acute bronchitis)"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Treatment plan</label>
        <textarea id="modal-emr-treat" class="form-input" style="height: 100px; resize: none;" required placeholder="Describe medicines, dosage recommendations, or rest logs"></textarea>
      </div>
    </form>
  `;

  // Fetch patient options for EMR dropdown
  fetchAPI('/patients').then(res => {
    const sel = document.getElementById('modal-emr-patient');
    if (res.success && sel) {
      sel.innerHTML = '<option value="">Select patient</option>' + 
        res.data.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
    }
  });

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-emr-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      patient: document.getElementById('modal-emr-patient').value,
      diagnosis: document.getElementById('modal-emr-diag').value.trim(),
      treatment: document.getElementById('modal-emr-treat').value.trim()
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/medical-records', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      await fetchMedicalRecords(false);
      renderClinicalHistoryTab(true, false);
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to save record.');
    }
  };
};

const openPrescriptionModal = () => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Issue prescription';
  submitBtn.innerText = 'Fulfill prescription';

  body.innerHTML = `
    <form id="modal-presc-form">
      <div class="form-group">
        <label class="form-label">Active appointment</label>
        <select id="modal-presc-appt" class="form-input" required>
          <option value="">Select appointment</option>
        </select>
      </div>
      
      <div style="border: var(--border-hairline); border-radius: var(--radius-md); padding: var(--space-md); margin-top: var(--space-md);">
        <h5 style="margin-bottom: var(--space-sm);">Medicine line items</h5>
        <div id="presc-medicines-list">
          <div class="med-item-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
            <input type="text" class="form-input med-name" placeholder="Name" required>
            <input type="text" class="form-input med-dose" placeholder="Dose (e.g. 500mg)" required>
            <input type="text" class="form-input med-duration" placeholder="Duration (e.g. 5d)" required>
          </div>
        </div>
        <div class="form-group" style="margin-top: 8px; margin-bottom: 0;">
          <input type="text" id="modal-presc-inst" class="form-input" placeholder="Directions (e.g. 1 tab morning after food)" required>
        </div>
      </div>
    </form>
  `;

  // Fetch appointments for dropdown (only confirmed/completed)
  fetchAPI('/appointments').then(res => {
    const sel = document.getElementById('modal-presc-appt');
    if (res.success && sel) {
      sel.innerHTML = '<option value="">Select appointment</option>' +
        res.data.map(a => `<option value="${a._id}">${a.patient?.name || 'Patient'} on ${new Date(a.date).toLocaleDateString()}</option>`).join('');
    }
  });

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-presc-form');
    if (!formEl.reportValidity()) return;

    const medRows = document.querySelectorAll('.med-item-row');
    const medicines = [];
    medRows.forEach(row => {
      medicines.push({
        name: row.querySelector('.med-name').value.trim(),
        dosage: row.querySelector('.med-dose').value.trim(),
        duration: row.querySelector('.med-duration').value.trim(),
        instructions: document.getElementById('modal-presc-inst').value.trim()
      });
    });

    const payload = {
      appointment: document.getElementById('modal-presc-appt').value,
      medicines
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      alert('Prescription successfully registered and passed to pharmacy inventory.');
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to submit prescription.');
    }
  };
};

const getMockRecords = () => [
  { _id: 'rec1', diagnosis: 'Mild hypertension & general anxiety', treatment: 'Start beta blockers and recommend breathing exercises.', visitDate: new Date(), doctor: { user: { name: 'Dr. Gregory House' } } }
];

const getMockPrescriptions = () => [
  {
    _id: 'p1',
    issuedDate: new Date(),
    doctor: { user: { name: 'Dr. Gregory House' } },
    medicines: [
      { name: 'Metoprolol Succinate', dosage: '25mg', duration: '30 days', instructions: 'Take 1 tablet daily in the morning.' }
    ]
  }
];
