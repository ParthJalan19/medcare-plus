import { fetchAPI, BACKEND_URL } from '../api.js';

export const renderReports = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
      <div>
        <h2 style="font-size: 1.5rem; font-weight: 600;">Reports & hospital analytics</h2>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">Download spreadsheet ledgers and analyze clinic performance</p>
      </div>
      <div style="display: flex; gap: var(--space-xs);">
        <button id="export-excel-btn" class="btn btn-secondary">
          <i data-lucide="sheet"></i>Export Excel log
        </button>
        <button id="export-pdf-btn" class="btn btn-primary">
          <i data-lucide="file-text"></i>Export PDF summary
        </button>
      </div>
    </div>

    <!-- Analytics Dashboard -->
    <div class="charts-grid" style="grid-template-columns: 1fr 1fr;">
      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Monthly clinical earnings ($)</h3>
        </div>
        <div style="height: 300px; position: relative;">
          <canvas id="monthly-revenue-chart"></canvas>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-header">
          <h3 class="chart-title">Admissions by patient gender</h3>
        </div>
        <div style="height: 300px; position: relative;">
          <canvas id="gender-ratio-chart"></canvas>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Attach export events
  document.getElementById('export-excel-btn').addEventListener('click', () => {
    const token = localStorage.getItem('accessToken');
    window.open(`${BACKEND_URL}/api/v1/reports/export/excel?token=${token}`, '_blank');
  });

  document.getElementById('export-pdf-btn').addEventListener('click', () => {
    const token = localStorage.getItem('accessToken');
    window.open(`${BACKEND_URL}/api/v1/reports/export/pdf?token=${token}`, '_blank');
  });

  // Paint Charts
  setTimeout(() => {
    drawRevenueChart();
    drawGenderRatioChart();
  }, 100);
};

const drawRevenueChart = () => {
  const ctx = document.getElementById('monthly-revenue-chart')?.getContext('2d');
  if (!ctx) return;

  if (window.revenueChartInstance) {
    window.revenueChartInstance.destroy();
  }

  window.revenueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Earnings ($)',
        data: [1500, 2300, 1800, 3100, 2900, 4200, 3800],
        backgroundColor: '#0F6E56',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [5, 5] } }
      }
    }
  });
};

const drawGenderRatioChart = () => {
  const ctx = document.getElementById('gender-ratio-chart')?.getContext('2d');
  if (!ctx) return;

  if (window.genderChartInstance) {
    window.genderChartInstance.destroy();
  }

  window.genderChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Male', 'Female', 'Other'],
      datasets: [{
        data: [55, 40, 5],
        backgroundColor: ['#0F6E56', '#10b981', '#cbd5e1'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
};
