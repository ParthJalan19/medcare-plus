import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let appointmentsList = [];
let doctorsList = [];
let patientsList = [];
let departmentsList = [];

export const renderAppointments = async (mountTarget) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isPatient = userInfo.role === 'patient';

  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Appointments calendar</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Schedule and review patient visits</p>
      </div>
      <button id="book-appt-btn" class="btn btn-primary">
        <i data-lucide="calendar-plus"></i>${isPatient ? 'Book appointment' : 'Schedule appointment'}
      </button>
    </div>

    <!-- Appointments Container -->
    <div id="appointments-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Fetching scheduled appointments...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  document.getElementById('book-appt-btn').addEventListener('click', () => openBookingModal(isPatient, userInfo));

  await fetchAppointments(isPatient);
  await fetchMetadata();
};

const fetchAppointments = async (isPatient) => {
  const container = document.getElementById('appointments-container');
  if (!container) return;

  const endpoint = isPatient ? '/appointments/my-appointments' : '/appointments';
  const res = await fetchAPI(endpoint);
  
  if (res.success) {
    appointmentsList = res.data;
  } else {
    appointmentsList = getMockAppointments();
  }

  renderAppointmentsList(appointmentsList, isPatient);
};

const fetchMetadata = async () => {
  const docRes = await fetchAPI('/doctors');
  if (docRes.success) doctorsList = docRes.data;

  const patRes = await fetchAPI('/patients');
  if (patRes.success) patientsList = patRes.data;

  const deptRes = await fetchAPI('/doctors/departments');
  if (deptRes.success) departmentsList = deptRes.data;
};

const renderAppointmentsList = (list, isPatient) => {
  const container = document.getElementById('appointments-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="calendar" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No appointments scheduled</h3>
        <p class="empty-state-desc">There are no upcoming or past visits in the ledger.</p>
        <button onclick="document.getElementById('book-appt-btn').click()" class="btn btn-primary">Book appointment</button>
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
            <th>${isPatient ? 'Specialist' : 'Patient'}</th>
            <th>Department</th>
            <th>Date / Time</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(appt => {
            const dateStr = new Date(appt.date).toLocaleDateString();
            const badgeClass = appt.status === 'confirmed' || appt.status === 'completed' ? 'success' : appt.status === 'pending' ? 'pending' : 'danger';
            return `
              <tr>
                <td style="font-weight: 600;">${isPatient ? (appt.doctor?.user?.name || appt.doctorName) : (appt.patient?.name || appt.patientName)}</td>
                <td>${appt.department?.name || 'General'}</td>
                <td>${dateStr} at ${appt.timeSlot}</td>
                <td>${appt.reason}</td>
                <td><span class="badge badge-${badgeClass}">${appt.status}</span></td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    ${!isPatient && appt.status === 'pending' ? `
                      <button class="btn btn-secondary btn-sm status-change-btn" data-id="${appt._id}" data-status="confirmed" style="padding: 2px 6px; font-size: 0.75rem; background-color: var(--primary-light); color: var(--primary);">Confirm</button>
                    ` : ''}
                    ${!isPatient && appt.status === 'confirmed' ? `
                      <button class="btn btn-secondary btn-sm status-change-btn" data-id="${appt._id}" data-status="completed" style="padding: 2px 6px; font-size: 0.75rem; background-color: #e6f7ed; color: #10b981;">Complete</button>
                    ` : ''}
                    ${appt.status !== 'cancelled' && appt.status !== 'completed' ? `
                      <button class="btn btn-danger btn-sm status-change-btn" data-id="${appt._id}" data-status="cancelled" style="padding: 2px 6px; font-size: 0.75rem;">Cancel</button>
                    ` : '-'}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  // Attach status change events
  container.querySelectorAll('.status-change-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      const status = e.target.getAttribute('data-status');
      
      const res = await fetchAPI(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });

      if (res.success) {
        await fetchAppointments(isPatient);
      } else {
        alert(res.error || 'Status update failed');
      }
    });
  });
};

const openBookingModal = (isPatient, userInfo) => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Book appointment';
  submitBtn.innerText = 'Confirm booking';

  body.innerHTML = `
    <form id="modal-appt-form">
      ${isPatient ? '' : `
        <div class="form-group">
          <label class="form-label">Patient</label>
          <select id="modal-appt-patient" class="form-input" required>
            <option value="">Select patient</option>
            ${patientsList.map(p => `<option value="${p._id}">${p.name} (DOB: ${new Date(p.DOB).toLocaleDateString()})</option>`).join('')}
          </select>
        </div>
      `}
      <div class="form-group">
        <label class="form-label">Doctor / Specialist</label>
        <select id="modal-appt-doctor" class="form-input" required>
          <option value="">Select doctor</option>
          ${doctorsList.map(d => `<option value="${d._id}">${d.user?.name || d.name} - ${d.specialization}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Department</label>
        <select id="modal-appt-dept" class="form-input" required>
          <option value="">Select department</option>
          ${departmentsList.length > 0 ? departmentsList.map(dept => `
            <option value="${dept._id}">${dept.name}</option>
          `).join('') : `
            <option value="cardiology_id">Cardiology</option>
            <option value="pediatrics_id">Pediatrics</option>
          `}
        </select>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Appointment date</label>
          <input type="date" id="modal-appt-date" class="form-input" required min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Preferred slot</label>
          <select id="modal-appt-slot" class="form-input" required>
            <option value="">Choose slot</option>
            <option value="09:00-09:30">09:00 - 09:30 AM</option>
            <option value="09:30-10:00">09:30 - 10:00 AM</option>
            <option value="10:00-10:30">10:00 - 10:30 AM</option>
            <option value="10:30-11:00">10:30 - 11:00 AM</option>
            <option value="11:00-11:30">11:00 - 11:30 AM</option>
            <option value="11:30-12:00">11:30 - 12:00 PM</option>
            <option value="14:00-14:30">02:00 - 02:30 PM</option>
            <option value="14:30-15:00">02:30 - 03:00 PM</option>
            <option value="15:00-15:30">03:00 - 03:30 PM</option>
            <option value="15:30-16:00">03:30 - 04:00 PM</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Reason for visit</label>
        <textarea id="modal-appt-reason" class="form-input" style="height: 80px; resize: none;" required placeholder="Describe symptoms or request purpose"></textarea>
      </div>
    </form>
  `;

  modal.classList.add('open');

  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-appt-form');
    if (!formEl.reportValidity()) return;

    let patientId = '';
    if (isPatient) {
      // Find this patient profile linked to active user
      const res = await fetchAPI('/patients/me');
      if (res.success && res.data) {
        patientId = res.data._id;
      } else {
        alert('Could not find your patient profile. Please contact clinical staff.');
        return;
      }
    } else {
      patientId = document.getElementById('modal-appt-patient').value;
    }

    const payload = {
      patient: patientId,
      doctor: document.getElementById('modal-appt-doctor').value,
      department: document.getElementById('modal-appt-dept').value,
      date: document.getElementById('modal-appt-date').value,
      timeSlot: document.getElementById('modal-appt-slot').value,
      reason: document.getElementById('modal-appt-reason').value.trim()
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      await fetchAppointments(isPatient);
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Operation failed');
    }
  };
};

const getMockAppointments = () => [
  { _id: 'a1', patientName: 'John Doe', doctorName: 'Dr. Gregory House', date: new Date(), timeSlot: '10:00-10:30', reason: 'Chronic hypertension follow-up', status: 'confirmed', department: { name: 'Cardiology' } }
];
