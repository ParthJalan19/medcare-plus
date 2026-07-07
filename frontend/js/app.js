import router from './router.js';
import { getAccessToken, fetchAPI, handleAuthFailure } from './api.js';

// Import Views
import {
  publicHome,
  publicAbout,
  publicServices,
  publicDoctors,
  publicContact,
  authLogin,
  authRegister,
  authForgotPassword,
  authResetPassword
} from './views/public.js';

import { renderDashboard } from './views/dashboard.js';

// Register public & auth views
router.registerView('publicHome', publicHome);
router.registerView('publicAbout', publicAbout);
router.registerView('publicServices', publicServices);
router.registerView('publicDoctors', publicDoctors);
router.registerView('publicContact', publicContact);
router.registerView('authLogin', authLogin);
router.registerView('authRegister', authRegister);
router.registerView('authForgotPassword', authForgotPassword);
router.registerView('authResetPassword', authResetPassword);

// Register authenticated views
router.registerView('dashboard', renderDashboard);

// Scaffold empty placeholders for remaining views (to be populated in later milestones)
router.registerView('patients', async (mountTarget) => {
  const { renderPatients } = await import('./views/patients.js');
  await renderPatients(mountTarget);
});
router.registerView('doctorsMgmt', async (mountTarget) => {
  const { renderDoctors } = await import('./views/doctors.js');
  await renderDoctors(mountTarget);
});
router.registerView('appointments', async (mountTarget) => {
  const { renderAppointments } = await import('./views/appointments.js');
  await renderAppointments(mountTarget);
});
router.registerView('records', async (mountTarget) => {
  const { renderRecords } = await import('./views/records.js');
  await renderRecords(mountTarget);
});
router.registerView('pharmacy', async (mountTarget) => {
  const { renderPharmacy } = await import('./views/pharmacy.js');
  await renderPharmacy(mountTarget);
});
router.registerView('laboratory', async (mountTarget) => {
  const { renderLaboratory } = await import('./views/laboratory.js');
  await renderLaboratory(mountTarget);
});
router.registerView('billing', async (mountTarget) => {
  const { renderBilling } = await import('./views/billing.js');
  await renderBilling(mountTarget);
});
router.registerView('staff', async (mountTarget) => {
  const { renderStaff } = await import('./views/staff.js');
  await renderStaff(mountTarget);
});
router.registerView('reports', async (mountTarget) => {
  const { renderReports } = await import('./views/reports.js');
  await renderReports(mountTarget);
});
router.registerView('settings', async (mountTarget) => {
  const { renderSettings } = await import('./views/settings.js');
  await renderSettings(mountTarget);
});

// Register Error Views
router.registerView('error403', async (mountTarget) => {
  mountTarget.innerHTML = `
    <div class="empty-state">
      <i data-lucide="shield-alert" class="empty-state-icon" style="color: var(--status-danger);"></i>
      <h3 class="empty-state-title">Access denied</h3>
      <p class="empty-state-desc">You do not have the required permissions to view this dashboard.</p>
      <a href="#/dashboard" class="btn btn-primary">Return to dashboard</a>
    </div>
  `;
});

router.registerView('error404', async (mountTarget) => {
  mountTarget.innerHTML = `
    <div class="empty-state">
      <i data-lucide="help-circle" class="empty-state-icon"></i>
      <h3 class="empty-state-title">Page not found</h3>
      <p class="empty-state-desc">The URL route you are trying to visit does not exist.</p>
      <a href="#/" class="btn btn-primary">Go to home</a>
    </div>
  `;
});

// Sidebar Navigation Lists by Role
const sidebarMenus = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Patients', path: '/patients', icon: 'users' },
    { label: 'Doctors', path: '/doctors-mgmt', icon: 'user-cog' },
    { label: 'Appointments', path: '/appointments', icon: 'calendar' },
    { label: 'Medical records', path: '/records', icon: 'file-text' },
    { label: 'Laboratory', path: '/laboratory', icon: 'flask-conical' },
    { label: 'Pharmacy', path: '/pharmacy', icon: 'pill' },
    { label: 'Billing', path: '/billing', icon: 'credit-card' },
    { label: 'Staff', path: '/staff', icon: 'shield' },
    { label: 'Reports', path: '/reports', icon: 'bar-chart3' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ],
  doctor: [
    { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Patients', path: '/patients', icon: 'users' },
    { label: 'Appointments', path: '/appointments', icon: 'calendar' },
    { label: 'Medical records', path: '/records', icon: 'file-text' },
    { label: 'Laboratory', path: '/laboratory', icon: 'flask-conical' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ],
  receptionist: [
    { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Patients', path: '/patients', icon: 'users' },
    { label: 'Doctors', path: '/doctors-mgmt', icon: 'user-cog' },
    { label: 'Appointments', path: '/appointments', icon: 'calendar' },
    { label: 'Billing', path: '/billing', icon: 'credit-card' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ],
  nurse: [
    { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Patients', path: '/patients', icon: 'users' },
    { label: 'Appointments', path: '/appointments', icon: 'calendar' },
    { label: 'Medical records', path: '/records', icon: 'file-text' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ],
  lab: [
    { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Laboratory', path: '/laboratory', icon: 'flask-conical' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ],
  pharmacist: [
    { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Pharmacy', path: '/pharmacy', icon: 'pill' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ],
  patient: [
    { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    { label: 'Appointments', path: '/appointments', icon: 'calendar' },
    { label: 'Medical records', path: '/records', icon: 'file-text' },
    { label: 'Billing', path: '/billing', icon: 'credit-card' },
    { label: 'Settings', path: '/settings', icon: 'settings' }
  ]
};

// Generate Sidebar Links Based on Logged In Role
const buildSidebar = (role) => {
  const menuList = sidebarMenus[role] || sidebarMenus['patient'];
  const menuContainer = document.getElementById('sidebar-items');
  if (!menuContainer) return;

  menuContainer.innerHTML = menuList
    .map(item => `
      <li class="sidebar-item">
        <a href="#${item.path}">
          <i data-lucide="${item.icon}"></i>
          <span>${item.label}</span>
        </a>
      </li>
    `).join('');
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

// Handle Shell Updates on Login/Routing
const updateShell = () => {
  const token = getAccessToken();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  
  if (token && userInfo.role) {
    buildSidebar(userInfo.role);
    
    // Update Profile Indicators
    const usernameEl = document.getElementById('sidebar-username');
    const roleEl = document.getElementById('sidebar-role');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    const topbarAvatar = document.getElementById('topbar-avatar');

    if (usernameEl) usernameEl.innerText = userInfo.name;
    if (roleEl) roleEl.innerText = userInfo.role;
    if (sidebarAvatar && userInfo.avatar) sidebarAvatar.src = userInfo.avatar;
    if (topbarAvatar && userInfo.avatar) topbarAvatar.src = userInfo.avatar;
  }
};

// Global App Event Listeners
const setupGlobalEvents = () => {
  // Mobile Hamburger Drawer Toggle
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const sidebar = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  if (hamburgerBtn && sidebar && sidebarBackdrop) {
    const toggleSidebar = () => {
      sidebar.classList.toggle('open');
      sidebarBackdrop.classList.toggle('open');
    };
    
    hamburgerBtn.addEventListener('click', toggleSidebar);
    sidebarBackdrop.addEventListener('click', toggleSidebar);
  }

  // Profile Menu Dropdown Toggle
  const profileTrigger = document.getElementById('profile-trigger');
  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileTrigger && profileDropdown) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      profileDropdown.classList.remove('open');
    });
  }

  // Logout Handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const res = await fetchAPI('/auth/logout', { method: 'POST' });
      if (res.success) {
        handleAuthFailure();
      }
    });
  }

  // Global search mock alert (notifying user that online filters apply in respective sub-pages)
  const searchInput = document.getElementById('global-search');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        alert(`Global Search for "${searchInput.value}" triggered. Filters apply inside specific views.`);
      }
    });
  }
};

// Watch token status to rebuild shell elements
window.addEventListener('hashchange', updateShell);
window.addEventListener('load', () => {
  updateShell();
  setupGlobalEvents();
  router.handleRoute(); // Execute router match
});
export { updateShell };
