import { fetchAPI } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

let medicinesList = [];
let inventoryList = [];

export const renderPharmacy = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Pharmacy & stock inventory</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Monitor medicine catalogues, batches, and reorder alerts</p>
      </div>
      <div style="display: flex; gap: var(--space-xs);">
        <button id="add-med-btn" class="btn btn-secondary"><i data-lucide="plus"></i>Add medicine</button>
        <button id="add-batch-btn" class="btn btn-primary"><i data-lucide="package-plus"></i>Add batch stock</button>
      </div>
    </div>

    <!-- Tabs Header -->
    <div style="border-bottom: 2px solid var(--border-color); display: flex; gap: var(--space-lg); margin-bottom: var(--space-lg);">
      <button id="tab-meds" class="btn btn-secondary" style="border-radius: 0; background: none; border-bottom: 2px solid var(--primary); color: var(--primary); padding: 8px 16px; font-weight: 600;">Medicine directory</button>
      <button id="tab-inventory" class="btn btn-secondary" style="border-radius: 0; background: none; color: var(--text-secondary); padding: 8px 16px;">Stock batches</button>
    </div>

    <!-- Inventory Mount Target -->
    <div id="pharmacy-content-container">
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading pharmacy database...</p>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const tabMeds = document.getElementById('tab-meds');
  const tabInv = document.getElementById('tab-inventory');

  tabMeds.onclick = () => {
    tabMeds.style.borderBottom = '2px solid var(--primary)';
    tabMeds.style.color = 'var(--primary)';
    tabInv.style.borderBottom = 'none';
    tabInv.style.color = 'var(--text-secondary)';
    renderMedsTab();
  };

  tabInv.onclick = () => {
    tabInv.style.borderBottom = '2px solid var(--primary)';
    tabInv.style.color = 'var(--primary)';
    tabMeds.style.borderBottom = 'none';
    tabMeds.style.color = 'var(--text-secondary)';
    renderInventoryTab();
  };

  document.getElementById('add-med-btn').addEventListener('click', () => openMedicineModal());
  document.getElementById('add-batch-btn').addEventListener('click', () => openBatchModal());

  await fetchMeds();
  renderMedsTab();
};

const fetchMeds = async () => {
  const res = await fetchAPI('/pharmacy/medicines');
  if (res.success) {
    medicinesList = res.data;
  } else {
    medicinesList = getMockMeds();
  }
};

const fetchInventory = async () => {
  const res = await fetchAPI('/pharmacy/inventory');
  if (res.success) {
    inventoryList = res.data;
  } else {
    inventoryList = getMockInventory();
  }
};

const renderMedsTab = () => {
  const container = document.getElementById('pharmacy-content-container');
  if (!container) return;

  if (medicinesList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="pill" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No medicines catalogued</h3>
        <p class="empty-state-desc">The pharmacy catalogue is currently empty.</p>
        <button onclick="document.getElementById('add-med-btn').click()" class="btn btn-primary">Add medicine</button>
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
            <th>Medicine Name</th>
            <th>Category</th>
            <th>Packaging Unit</th>
            <th>Reorder Alert Threshold</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${medicinesList.map(m => `
            <tr>
              <td style="font-weight: 600; color: var(--primary);">${m.name}</td>
              <td>${m.category}</td>
              <td style="text-transform: capitalize;">${m.unit}</td>
              <td><span class="badge badge-pending">${m.reorderThreshold} units</span></td>
              <td>-</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
};

const renderInventoryTab = async () => {
  const container = document.getElementById('pharmacy-content-container');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Loading batch logs...</p>
    </div>
  `;

  await fetchInventory();

  if (inventoryList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package" class="empty-state-icon"></i>
        <h3 class="empty-state-title">No batches found</h3>
        <p class="empty-state-desc">No replenishment batches have been recorded.</p>
        <button onclick="document.getElementById('add-batch-btn').click()" class="btn btn-primary">Add batch stock</button>
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
            <th>Medicine</th>
            <th>Batch Code</th>
            <th>Quantity in Stock</th>
            <th>Supplier</th>
            <th>Expiry Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${inventoryList.map(item => {
            const isLow = item.quantity <= (item.medicine?.reorderThreshold || 20);
            const isExpired = new Date(item.expiryDate) < new Date();
            const badgeClass = isExpired ? 'danger' : isLow ? 'pending' : 'success';
            const statusLabel = isExpired ? 'Expired' : isLow ? 'Low stock' : 'In stock';

            return `
              <tr style="${isLow || isExpired ? 'background-color: var(--status-danger-bg);' : ''}">
                <td style="font-weight: 600;">${item.medicine?.name || 'Unknown Medicine'}</td>
                <td><code>${item.batchNumber}</code></td>
                <td style="font-weight: 600;">${item.quantity}</td>
                <td>${item.supplier || '-'}</td>
                <td>${new Date(item.expiryDate).toLocaleDateString()}</td>
                <td><span class="badge badge-${badgeClass}">${statusLabel}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
};

// MODALS FOR MEDICINE & BATCH
const openMedicineModal = () => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Add medicine description';
  submitBtn.innerText = 'Save medicine';

  body.innerHTML = `
    <form id="modal-med-form">
      <div class="form-group">
        <label class="form-label">Medicine name</label>
        <input type="text" id="modal-med-name" class="form-input" required placeholder="e.g. Paracetamol">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <input type="text" id="modal-med-cat" class="form-input" required placeholder="e.g. Analgesic, Antibiotic">
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Packaging unit</label>
          <select id="modal-med-unit" class="form-input">
            <option value="tablet">Tablet</option>
            <option value="capsule">Capsule</option>
            <option value="bottle">Bottle (Syrup)</option>
            <option value="vial">Vial (Injection)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Reorder alert threshold</label>
          <input type="number" id="modal-med-thresh" class="form-input" value="50" min="0">
        </div>
      </div>
    </form>
  `;

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-med-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      name: document.getElementById('modal-med-name').value.trim(),
      category: document.getElementById('modal-med-cat').value.trim(),
      unit: document.getElementById('modal-med-unit').value,
      reorderThreshold: parseInt(document.getElementById('modal-med-thresh').value)
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/pharmacy/medicines', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      await fetchMeds();
      renderMedsTab();
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to register medicine.');
    }
  };
};

const openBatchModal = () => {
  const modal = document.getElementById('global-modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const submitBtn = document.getElementById('modal-submit-btn');
  const cancelBtn = document.getElementById('modal-cancel-btn');

  title.innerText = 'Add batch stock';
  submitBtn.innerText = 'Fulfill batch';

  body.innerHTML = `
    <form id="modal-batch-form">
      <div class="form-group">
        <label class="form-label">Select medicine</label>
        <select id="modal-batch-med" class="form-input" required>
          <option value="">Select medicine</option>
          ${medicinesList.map(m => `<option value="${m._id}">${m.name} (${m.category})</option>`).join('')}
        </select>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
        <div class="form-group">
          <label class="form-label">Batch number</label>
          <input type="text" id="modal-batch-num" class="form-input" required placeholder="e.g. BATCH-2026-X">
        </div>
        <div class="form-group">
          <label class="form-label">Stock quantity</label>
          <input type="number" id="modal-batch-qty" class="form-input" required min="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Expiry date</label>
        <input type="date" id="modal-batch-exp" class="form-input" required>
      </div>
      <div class="form-group">
        <label class="form-label">Supplier name</label>
        <input type="text" id="modal-batch-sup" class="form-input" placeholder="e.g. PharmaCorp Supplies">
      </div>
    </form>
  `;

  modal.classList.add('open');
  const closeModal = () => modal.classList.remove('open');
  cancelBtn.onclick = closeModal;
  document.getElementById('modal-close').onclick = closeModal;

  submitBtn.onclick = async () => {
    const formEl = document.getElementById('modal-batch-form');
    if (!formEl.reportValidity()) return;

    const payload = {
      medicine: document.getElementById('modal-batch-med').value,
      batchNumber: document.getElementById('modal-batch-num').value.trim(),
      quantity: parseInt(document.getElementById('modal-batch-qty').value),
      expiryDate: document.getElementById('modal-batch-exp').value,
      supplier: document.getElementById('modal-batch-sup').value.trim()
    };

    submitBtn.disabled = true;
    const res = await fetchAPI('/pharmacy/inventory', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      closeModal();
      tabInv.click();
    } else {
      submitBtn.disabled = false;
      displayFormError(formEl, res.error || 'Failed to save batch stock.');
    }
  };
};

const getMockMeds = () => [
  { _id: 'med1', name: 'Metoprolol Succinate', category: 'Beta-Blocker', unit: 'tablet', reorderThreshold: 100 }
];

const getMockInventory = () => [
  { _id: 'b1', batchNumber: 'MET-2026-A1', quantity: 500, expiryDate: new Date('2028-12-31'), supplier: 'PharmaCorp Global', medicine: { name: 'Metoprolol Succinate', reorderThreshold: 100 } }
];
