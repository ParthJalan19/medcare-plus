import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let labTestsList = [];

export const renderLaboratory = async (mountTarget) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isLabStaff = userInfo.role === 'lab' || userInfo.role === 'admin';
  const isPatient = userInfo.role === 'patient';

  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Laboratory diagnostics</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Review lab tests ordered, analysis states, and result attachments</p>
      </div>
      ${isLabStaff ? `
        <button id="add-lab-test-btn" class="btn btn-primary"><i data-lucide="plus-circle"></i>Order lab test</button>
      ` : ''}
    </div>

    <!-- Lab Table Container -->
    <div id="lab-table-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading laboratory ledger...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  if (isLabStaff) {
    document.getElementById('add-lab-test-btn').addEventListener('click', () => openLabTestModal());
  }

  await fetchLabTests(isPatient);
};

const fetchLabTests = async (isPatient) => {
  const container = document.getElementById('lab-table-container');
  if (!container) return;

  const endpoint = isPatient ? '/laboratory/my-tests' : '/laboratory';
  const res = await fetchAPI(endpoint);

  if (res.success) {
    labTestsList = res.data;
  } else {
    labTestsList = getMockLabTests();
  }

  renderLabTable(labTestsList, isPatient);
};

const renderLabTable = (list, isPatient) => {
  const container = document.getElementById('lab-table-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="flask-conical" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No laboratory tests</h3>
        <p class="empty-state-desc">There are no diagnostic orders listed in the accounts.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isLabStaff = userInfo.role === 'lab' || userInfo.role === 'admin';

  container.innerHTML = `
    <div class="panel-card table-responsive" style="padding: 0;">
      <table class="med-table">
        <thead>
          <tr>
            <th>${isPatient ? 'Physician' : 'Patient'}</th>
            <th>Test Description</th>
            <th>Ordered Date</th>
            <th>Status</th>
            <th>Result File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(t => {
            const dateStr = new Date(t.orderedDate).toLocaleDateString();
            const badgeClass = t.status === 'completed' ? 'success' : t.status === 'in-progress' ? 'pending' : 'danger';
            
            return `
              <tr>
                <td style="font-weight: 600;">${isPatient ? (t.doctor?.user?.name || 'Dr. House') : (t.patient?.name || 'John Doe')}</td>
                <td style="font-weight: 600; color: var(--primary);">${t.testType}</td>
                <td>${dateStr}</td>
                <td><span class="badge badge-${badgeClass}">${t.status}</span></td>
                <td>
                  ${t.resultFile ? `
                    <a href="/${t.resultFile}" target="_blank" class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 0.75rem;">
                      <i data-lucide="download" style="width: 12px; height: 12px; display: inline; vertical-align: middle;"></i> PDF report
                    </a>
                  ` : '-'}
                </td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    ${isLabStaff && t.status === 'ordered' ? `
                      <button class="btn btn-secondary btn-sm status-change-btn" data-id="${t._id}" data-status="in-progress" style="padding: 2px 6px; font-size: 0.75rem;">Analyze</button>
                    ` : ''}
                    ${isLabStaff && t.status === 'in-progress' ? `
                      <button class="btn btn-primary btn-sm upload-results-btn" data-id="${t._id}" style="padding: 2px 6px; font-size: 0.75rem;">Upload PDF</button>
                    ` : ''}
                    ${t.status === 'completed' ? 'Done' : ''}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach status change events
  container.querySelectorAll('.status-change-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const status = e.target.getAttribute('data-status');
      
      const res = await fetchAPI(`/laboratory/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      if (res.success) {
        await fetchLabTests(isPatient);
      } else {
        alert(res.error || 'Failed to update test state.');
      }
    });
  });

  // Attach upload results click
  container.querySelectorAll('.upload-results-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      openResultUploadModal(id, isPatient);
    });
  });
};

const openLabTestModal = () => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Order laboratory test';
  submitBtn.innerText = 'Submit order';

  body.innerHTML = `
    <form id="modal-lab-form">
      <div class="form-group">
        <label class="form-label">Patient</label>
        <select id="modal-lab-patient" class="form-input" required>
          <option value="">Select patient</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Test Type</label>
        <input type="text" id="modal-lab-type" class="form-input" required placeholder="e.g. Complete Blood Count (CBC)">
      </div>
    </form>
  `;

  // Fetch patients for dropdown
  fetchAPI('/patients').then(res => {
    const sel = document.getElementById('modal-lab-patient');
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
    const formEl = document.getElementById('modal-lab-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      patient: document.getElementById('modal-lab-patient').value,
      testType: document.getElementById('modal-lab-type').value.trim()
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/laboratory', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      await fetchLabTests(false);
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to submit lab order.');
    }
  };
};

const openResultUploadModal = (testId, isPatient) => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Upload analysis results';
  submitBtn.innerText = 'Submit report PDF';

  body.innerHTML = `
    <form id="modal-upload-form" enctype="multipart/form-data">
      <div class="form-group">
        <label class="form-label">Report PDF (Max 5MB)</label>
        <input type="file" id="modal-upload-file" class="form-input" accept="application/pdf" required style="padding: 8px;">
      </div>
    </form>
  `;

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-upload-form');
    if (!formEl.reportValidity()) return;

    const fileInput = document.getElementById('modal-upload-file');
    const file = fileInput.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('resultFile', file); // Field name expected in multer upload

    submitBtn.disabled = true;
    submitBtn.innerText = 'Uploading...';

    // Call dynamic uploads endpoint (passing token in request headers)
    const token = localStorage.getItem('accessToken');
    try {
      const uploadRes = await fetch(`/api/v1/laboratory/${testId}/results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const res = await uploadRes.json();
      if (res.success) {
        closeModal();
        await fetchLabTests(isPatient);
      } else {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit report PDF';
        alert(res.error || 'Failed to upload PDF results.');
      }
    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.innerText = 'Submit report PDF';
      alert('Network upload failed.');
    }
  };
};

const getMockLabTests = () => [
  { _id: 't1', testType: 'Complete Blood Count (CBC)', orderedDate: new Date(), status: 'completed', resultFile: 'uploads/cbc_report_sample.pdf', patient: { name: 'John Doe' } }
];
