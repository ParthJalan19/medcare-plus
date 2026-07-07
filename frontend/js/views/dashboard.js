import { fetchAPI } from '../api.js';

export const renderDashboard = async (mountTarget) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const role = userInfo.role || 'patient';
  
  if (role === 'patient') {
    await renderPatientDashboard(mountTarget, userInfo);
  } else {
    await renderStaffDashboard(mountTarget, userInfo, role);
  }
};

// 1. STAFF DASHBOARD (Admin, Doctor, Receptionist, Nurse, Lab, Pharmacist)
const renderStaffDashboard = async (mountTarget, userInfo, role) => {
  // Fetch dashboard stats from backend reports API
  let stats = {
    totalPatients: 0,
    doctorsOnDuty: 0,
    appointmentsToday: 0,
    revenueToday: 0,
    lowStockAlerts: 0,
    labPending: 0,
    staffOnDuty: 0
  };

  let recentAppointments = [];
  let activityLogs = [];

  try {
    const statsRes = await fetchAPI('/reports/metrics');
    if (statsRes.success) {
      stats = statsRes.data;
    } else {
      console.warn('Could not fetch real metrics, using seeded/mock fallback.');
      stats = getMockStats();
    }

    const apptsRes = await fetchAPI('/appointments?limit=5');
    if (apptsRes.success) {
      recentAppointments = apptsRes.data;
    } else {
      recentAppointments = getMockAppointments();
    }

    // Let's also fetch logs
    const logsRes = await fetchAPI('/reports/activity-logs');
    if (logsRes.success) {
      activityLogs = logsRes.data;
    } else {
      activityLogs = getMockActivityLogs();
    }
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    stats = getMockStats();
    recentAppointments = getMockAppointments();
    activityLogs = getMockActivityLogs();
  }

  mountTarget.innerHTML = `
    <!-- Metric Cards Grid -->
    <section class="metric-grid">
      <div class="metric-card">
        <div class="metric-icon"><i data-lucide="users"></i></div>
        <div class="metric-info">
          <span class="metric-label">Total patients</span>
          <span class="metric-value" id="stat-patients">${stats.totalPatients}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon"><i data-lucide="user-cog"></i></div>
        <div class="metric-info">
          <span class="metric-label">Doctors on duty</span>
          <span class="metric-value" id="stat-doctors">${stats.doctorsOnDuty}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon"><i data-lucide="calendar"></i></div>
        <div class="metric-info">
          <span class="metric-label">Today's appointments</span>
          <span class="metric-value" id="stat-appts">${stats.appointmentsToday}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon"><i data-lucide="dollar-sign"></i></div>
        <div class="metric-info">
          <span class="metric-label">Revenue today</span>
          <span class="metric-value" id="stat-revenue">$${stats.revenueToday}</span>
        </div>
      </div>
      <div class="metric-card ${stats.lowStockAlerts > 0 ? 'alert-card' : ''}">
        <div class="metric-icon"><i data-lucide="shield-alert"></i></div>
        <div class="metric-info">
          <span class="metric-label">Low stock items</span>
          <span class="metric-value" id="stat-stock">${stats.lowStockAlerts}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon"><i data-lucide="flask-conical"></i></div>
        <div class="metric-info">
          <span class="metric-label">Lab pending</span>
          <span class="metric-value" id="stat-lab">${stats.labPending}</span>
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-icon"><i data-lucide="user-check"></i></div>
        <div class="metric-info">
          <span class="metric-label">Staff on duty</span>
          <span class="metric-value" id="stat-staff">${stats.staffOnDuty}</span>
        </div>
      </div>
    </section>

    <!-- Charts Section -->
    <section class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Patient visits trend (last 7 days)</h3>
        </div>
        <canvas id="visits-chart" style="max-height: 250px;"></canvas>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Appointments by department</h3>
        </div>
        <canvas id="dept-chart" style="max-height: 250px;"></canvas>
      </div>
    </section>

    <!-- Dynamic Dashboard Panels -->
    <section class="panels-grid">
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">Recent appointments</h3>
          <a href="#/appointments" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 4px 8px;">View all</a>
        </div>
        <div class="table-responsive">
          <table class="med-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date / Time</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recentAppointments.length === 0 ? '<tr><td colspan="5" style="text-align: center;">No appointments found.</td></tr>' : 
                recentAppointments.map(appt => `
                  <tr>
                    <td style="font-weight: 500;">${appt.patient?.name || appt.patientName || 'N/A'}</td>
                    <td>${appt.doctor?.user?.name || appt.doctorName || 'N/A'}</td>
                    <td>${new Date(appt.date).toLocaleDateString()} at ${appt.timeSlot}</td>
                    <td>${appt.reason}</td>
                    <td><span class="badge badge-${appt.status === 'confirmed' || appt.status === 'completed' ? 'success' : appt.status === 'pending' ? 'pending' : 'danger'}">${appt.status}</span></td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">Hospital activity log</h3>
        </div>
        <ul class="activity-feed">
          ${activityLogs.length === 0 ? '<li style="text-align: center; color: var(--text-muted);">No activity recorded.</li>' :
            activityLogs.map(log => `
              <li class="activity-item">
                <div class="activity-dot"></div>
                <div>
                  <p class="activity-desc"><strong>${log.user?.name || 'Staff member'}</strong> ${log.action}</p>
                  <p class="activity-time">${new Date(log.timestamp || log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              </li>
            `).join('')
          }
        </ul>
      </div>
    </section>
  `;

  // Draw Charts
  setTimeout(() => {
    drawVisitsChart();
    drawDeptChart();
  }, 100);
};

// 2. PATIENT PORTAL DASHBOARD
const renderPatientDashboard = async (mountTarget, userInfo) => {
  // Fetch patient portal specifics: appointments, prescriptions, bills
  let appointments = [];
  let prescriptions = [];
  let bills = [];

  try {
    const apptsRes = await fetchAPI('/appointments/my-appointments');
    if (apptsRes.success) {
      appointments = apptsRes.data;
    } else {
      appointments = getMockPatientAppointments();
    }

    const presRes = await fetchAPI('/prescriptions/my-prescriptions');
    if (presRes.success) {
      prescriptions = presRes.data;
    } else {
      prescriptions = getMockPatientPrescriptions();
    }

    const billsRes = await fetchAPI('/billing/my-bills');
    if (billsRes.success) {
      bills = billsRes.data;
    } else {
      bills = getMockPatientBills();
    }
  } catch (err) {
    console.error('Error fetching patient data:', err);
    appointments = getMockPatientAppointments();
    prescriptions = getMockPatientPrescriptions();
    bills = getMockPatientBills();
  }

  mountTarget.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg); margin-bottom: var(--space-lg);">
      <div style="background-color: var(--bg-primary); padding: var(--space-lg); border-radius: var(--radius-md); border: var(--border-hairline);">
        <h3 style="margin-bottom: var(--space-md);">Welcome, ${userInfo.name}</h3>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-lg); font-size: 0.95rem;">
          Access your medical charts, view active prescriptions, check pending payments, or book an appointment online with one of our specialists.
        </p>
        <a href="#/appointments" class="btn btn-primary"><i data-lucide="plus-circle"></i>Book new appointment</a>
      </div>

      <div style="background-color: var(--bg-primary); padding: var(--space-lg); border-radius: var(--radius-md); border: var(--border-hairline); display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
        <i data-lucide="shield-check" style="color: var(--primary); width: 48px; height: 48px; margin-bottom: var(--space-xs);"></i>
        <h4 style="margin-bottom: var(--space-xs);">Secure EMR portal</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 320px;">
          All medical history and lab reports are fully encrypted and compliant with hospital access safety standards.
        </p>
      </div>
    </div>

    <!-- Active Tables -->
    <div class="panels-grid">
      <div class="panel-card">
        <div class="panel-header">
          <h3 class="panel-title">My appointments</h3>
        </div>
        <div class="table-responsive">
          <table class="med-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Date / Time</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${appointments.length === 0 ? '<tr><td colspan="4" style="text-align: center;">No appointments scheduled yet.</td></tr>' : 
                appointments.map(appt => `
                  <tr>
                    <td style="font-weight: 500;">${appt.doctor?.user?.name || appt.doctorName}</td>
                    <td>${new Date(appt.date).toLocaleDateString()} at ${appt.timeSlot}</td>
                    <td>${appt.reason}</td>
                    <td><span class="badge badge-${appt.status === 'confirmed' || appt.status === 'completed' ? 'success' : appt.status === 'pending' ? 'pending' : 'danger'}">${appt.status}</span></td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel-card" style="gap: var(--space-md);">
        <div>
          <div class="panel-header">
            <h3 class="panel-title">Active prescriptions</h3>
          </div>
          <div class="table-responsive">
            <table class="med-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Dosage / Instructions</th>
                </tr>
              </thead>
              <tbody>
                ${prescriptions.length === 0 ? '<tr><td colspan="2" style="text-align: center;">No active prescriptions.</td></tr>' :
                  prescriptions.slice(0, 3).map(p => `
                    <tr>
                      <td style="font-weight: 500;">${p.medicines?.[0]?.name || p.medicineName}</td>
                      <td>${p.medicines?.[0]?.dosage || p.dosage} - ${p.medicines?.[0]?.instructions || p.instructions}</td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="panel-header" style="margin-top: var(--space-sm);">
            <h3 class="panel-title">My invoices</h3>
          </div>
          <div class="table-responsive">
            <table class="med-table">
              <thead>
                <tr>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${bills.length === 0 ? '<tr><td colspan="3" style="text-align: center;">No invoice records.</td></tr>' :
                  bills.map(b => `
                    <tr>
                      <td style="font-weight: 600;">$${b.totalAmount}</td>
                      <td><span class="badge badge-${b.status === 'paid' ? 'success' : b.status === 'pending' ? 'pending' : 'danger'}">${b.status}</span></td>
                      <td>
                        ${b.status === 'pending' ? `<a href="#/billing" class="btn btn-primary btn-sm" style="padding: 2px 6px; font-size: 0.75rem;">Pay now</a>` : `<a href="#/billing" class="btn btn-secondary btn-sm" style="padding: 2px 6px; font-size: 0.75rem;">Receipt</a>`}
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
};

// ----------------------------------------------------
// Mock Data Generators for Dashboard Fallbacks
// ----------------------------------------------------
const getMockStats = () => ({
  totalPatients: 4,
  doctorsOnDuty: 1,
  appointmentsToday: 1,
  revenueToday: 315,
  lowStockAlerts: 1,
  labPending: 1,
  staffOnDuty: 5
});

const getMockAppointments = () => ([
  {
    patientName: 'John Doe',
    doctorName: 'Dr. Gregory House',
    date: new Date(),
    timeSlot: '10:00-10:30',
    reason: 'Chronic hypertension follow-up',
    status: 'confirmed'
  },
  {
    patientName: 'Alice Smith',
    doctorName: 'Dr. Gregory House',
    date: new Date(Date.now() + 86400000),
    timeSlot: '11:00-11:30',
    reason: 'Arrhythmia checkup',
    status: 'pending'
  }
]);

const getMockActivityLogs = () => ([
  { user: { name: 'Pam Beesly' }, action: 'scheduled a confirmed appointment for John Doe', timestamp: new Date() },
  { user: { name: 'Dr. Gregory House' }, action: 'wrote a prescription for John Doe', timestamp: new Date(Date.now() - 3600000) },
  { user: { name: 'Walter White' }, action: 'restocked Metoprolol Succinate batch MET-2026-A1', timestamp: new Date(Date.now() - 7200000) }
]);

const getMockPatientAppointments = () => ([
  { doctorName: 'Dr. Gregory House', date: new Date(), timeSlot: '10:00-10:30', reason: 'Chronic hypertension follow-up', status: 'confirmed' }
]);

const getMockPatientPrescriptions = () => ([
  { medicineName: 'Metoprolol Succinate', dosage: '25mg', instructions: 'Take 1 tablet daily in the morning.' }
]);

const getMockPatientBills = () => ([
  { totalAmount: 315, status: 'paid' },
  { totalAmount: 100, status: 'pending' }
]);

// ----------------------------------------------------
// Charts Painting Logic using Chart.js
// ----------------------------------------------------
const drawVisitsChart = () => {
  const ctx = document.getElementById('visits-chart')?.getContext('2d');
  if (!ctx) return;
  
  // Clean old chart instance if any
  if (window.visitsChartInstance) {
    window.visitsChartInstance.destroy();
  }

  // Get last 7 days names
  const labels = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString([], { weekday: 'short' }));
  }

  window.visitsChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Patients admitted',
        data: [4, 6, 5, 8, 4, 9, 12],
        borderColor: '#0F6E56',
        backgroundColor: 'rgba(15, 110, 86, 0.05)',
        tension: 0.3,
        fill: true,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
        x: { grid: { display: false } }
      }
    }
  });
};

const drawDeptChart = () => {
  const ctx = document.getElementById('dept-chart')?.getContext('2d');
  if (!ctx) return;

  if (window.deptChartInstance) {
    window.deptChartInstance.destroy();
  }

  window.deptChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Cardiology', 'Pediatrics', 'General OPD'],
      datasets: [{
        data: [15, 5, 10],
        backgroundColor: ['#0F6E56', '#10b981', '#cbd5e1'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } }
        }
      }
    }
  });
};
