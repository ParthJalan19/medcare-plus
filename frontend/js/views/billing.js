import { fetchAPI, BACKEND_URL } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let billsList = [];


export const renderBilling = async (mountTarget) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isReceptionist = userInfo.role === 'receptionist' || userInfo.role === 'admin';
  const isPatient = userInfo.role === 'patient';

  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Billing & invoices</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Review patient statements, receipts, and process payments</p>
      </div>
      ${isReceptionist ? `
        <button id="add-bill-btn" class="btn btn-primary"><i data-lucide="plus-circle"></i>Create invoice</button>
      ` : ''}
    </div>

    <!-- Billing Containers -->
    <div id="billing-table-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading invoice ledgers...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  if (isReceptionist) {
    document.getElementById('add-bill-btn').addEventListener('click', () => openInvoiceModal());
  }

  await fetchBills(isPatient);
};

const fetchBills = async (isPatient) => {
  const container = document.getElementById('billing-table-container');
  if (!container) return;

  const endpoint = isPatient ? '/billing/my-bills' : '/billing';
  const res = await fetchAPI(endpoint);

  if (res.success) {
    billsList = res.data;
  } else {
    billsList = getMockBills();
  }

  renderBillingTable(billsList, isPatient);
};

const renderBillingTable = (list, isPatient) => {
  const container = document.getElementById('billing-table-container');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="credit-card" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No statements found</h3>
        <p class="empty-state-desc">There are no diagnostic or clinical invoices recorded.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const isReceptionist = userInfo.role === 'receptionist' || userInfo.role === 'admin';

  container.innerHTML = `
    <div class="panel-card table-responsive" style="padding: 0;">
      <table class="med-table">
        <thead>
          <tr>
            <th>${isPatient ? 'ID' : 'Patient'}</th>
            <th>Itemized Summary</th>
            <th>Total Charge</th>
            <th>Status</th>
            <th>Invoice Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(b => {
            const dateStr = new Date(b.createdAt || Date.now()).toLocaleDateString();
            const badgeClass = b.status === 'paid' ? 'success' : b.status === 'pending' ? 'pending' : 'danger';
            const itemsSummary = b.lineItems?.map(li => li.description).join(', ') || 'Consultation fee';

            return `
              <tr>
                <td style="font-weight: 500;">${isPatient ? b._id.slice(-6) : (b.patient?.name || 'John Doe')}</td>
                <td style="font-size: 0.85rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemsSummary}</td>
                <td style="font-weight: 700; color: var(--primary);">$${b.totalAmount}</td>
                <td><span class="badge badge-${badgeClass}">${b.status}</span></td>
                <td>${dateStr}</td>
                <td>
                  <div style="display: flex; gap: 4px;">
                    <button class="btn btn-secondary btn-sm download-pdf-btn" data-id="${b._id}" style="padding: 2px 6px; font-size: 0.75rem;">
                      <i data-lucide="file-text" style="width: 12px; height: 12px; display: inline; vertical-align: middle;"></i> PDF receipt
                    </button>
                    ${b.status !== 'paid' ? `
                      <button class="btn btn-primary btn-sm pay-invoice-btn" data-id="${b._id}" style="padding: 2px 6px; font-size: 0.75rem;">Pay</button>
                    ` : ''}
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

  // Attach pay invoice handlers
  container.querySelectorAll('.pay-invoice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      const bill = billsList.find(b => b._id === id);
      if (bill) openPaymentModal(bill, isPatient);
    });
  });

  // Attach PDF receipt downloads
  container.querySelectorAll('.download-pdf-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-id');
      triggerPDFDownload(id);
    });
  });
};

const triggerPDFDownload = (billId) => {
  // Directly point window to backend PDF generation endpoint
  const token = localStorage.getItem('accessToken');
  window.open(`${BACKEND_URL}/api/v1/billing/${billId}/pdf?token=${token}`, '_blank');
};

const openPaymentModal = (bill, isPatient) => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = `Record invoice payment`;
  submitBtn.innerText = 'Verify payment';

  body.innerHTML = `
    <div style="margin-bottom: var(--space-md); border-bottom: var(--border-hairline); padding-bottom: var(--space-sm);">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Total due:</span>
        <strong style="color: var(--primary);">$${bill.totalAmount}</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Patient:</span>
        <span>${bill.patient?.name || 'Patient'}</span>
      </div>
    </div>
    <form id="modal-pay-form">
      <div class="form-group">
        <label class="form-label">Payment method</label>
        <select id="modal-pay-method" class="form-input" required>
          <option value="cash">Cash</option>
          <option value="card">Credit / Debit Card</option>
          <option value="insurance">Insurance Coverage</option>
          <option value="other">Other</option>
        </select>
      </div>
    </form>
  `;

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-pay-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      amount: bill.totalAmount,
      method: document.getElementById('modal-pay-method').value
    };

    submitBtn.disabled = true;
    const res = await fetchAPI(`/billing/${bill._id}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      await fetchBills(isPatient);
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to submit payment.');
    }
  };
};

const openInvoiceModal = () => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Create clinical invoice';
  submitBtn.innerText = 'Generate invoice';

  body.innerHTML = `
    <form id="modal-bill-form">
      <div class="form-group">
        <label class="form-label">Patient</label>
        <select id="modal-bill-patient" class="form-input" required>
          <option value="">Select patient</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Linked appointment</label>
        <select id="modal-bill-appt" class="form-input">
          <option value="">Select appointment (optional)</option>
        </select>
      </div>
      <div style="border: var(--border-hairline); border-radius: var(--radius-md); padding: var(--space-md); margin-top: var(--space-md);">
        <h5 style="margin-bottom: var(--space-sm);">Itemized charges</h5>
        <div id="bill-items-list">
          <div class="bill-item-row" style="display: grid; grid-template-columns: 2fr 1fr; gap: 8px; margin-bottom: 8px;">
            <input type="text" class="form-input item-desc" placeholder="Consultation fee / procedure" value="General consultation fee" required>
            <input type="number" class="form-input item-cost" placeholder="Amount" value="50" min="0" required>
          </div>
        </div>
      </div>
    </form>
  `;

  // Fetch patients and appointments
  fetchAPI('/patients').then(res => {
    const sel = document.getElementById('modal-bill-patient');
    if (res.success && sel) {
      sel.innerHTML = '<option value="">Select patient</option>' +
        res.data.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
    }
  });

  fetchAPI('/appointments').then(res => {
    const sel = document.getElementById('modal-bill-appt');
    if (res.success && sel) {
      sel.innerHTML = '<option value="">Select appointment (optional)</option>' +
        res.data.map(a => `<option value="${a._id}">${a.patient?.name || 'Patient'} on ${new Date(a.date).toLocaleDateString()}</option>`).join('');
    }
  });

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-bill-form');
    if (!formEl.reportValidity()) return;

    const rows = document.querySelectorAll('.bill-item-row');
    const lineItems = [];
    rows.forEach(r => {
      lineItems.push({
        description: r.querySelector('.item-desc').value.trim(),
        amount: parseFloat(r.querySelector('.item-cost').value)
      });
    });

    const payload = {
      patient: document.getElementById('modal-bill-patient').value,
      appointment: document.getElementById('modal-bill-appt').value || null,
      lineItems
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/billing', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      await fetchBills(false);
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to generate invoice.');
    }
  };
};

const getMockBills = () => [
  { _id: 'bill1', totalAmount: 315, status: 'paid', createdAt: new Date(), lineItems: [{ description: 'Consultation fee', amount: 150 }] }
];
