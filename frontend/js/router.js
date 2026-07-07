import { getAccessToken } from './api.js';

// Route Registry
const routes = {
  // Public
  '/': { view: 'publicHome', title: 'Home' },
  '/about': { view: 'publicAbout', title: 'About Us' },
  '/services': { view: 'publicServices', title: 'Our Services' },
  '/doctors': { view: 'publicDoctors', title: 'Our Specialists' },
  '/contact': { view: 'publicContact', title: 'Contact Us' },
  '/login': { view: 'authLogin', title: 'Login' },
  '/register': { view: 'authRegister', title: 'Patient Registration' },
  '/forgot-password': { view: 'authForgotPassword', title: 'Forgot Password' },
  '/reset-password': { view: 'authResetPassword', title: 'Reset Password' },

  // Authenticated (Role-Gated)
  '/dashboard': { view: 'dashboard', title: 'Dashboard', requiresAuth: true },
  '/patients': { view: 'patients', title: 'Patient Management', requiresAuth: true, allowedRoles: ['admin', 'doctor', 'receptionist', 'nurse'] },
  '/doctors-mgmt': { view: 'doctorsMgmt', title: 'Doctor Management', requiresAuth: true, allowedRoles: ['admin', 'receptionist'] },
  '/appointments': { view: 'appointments', title: 'Appointments Calendar', requiresAuth: true, allowedRoles: ['admin', 'doctor', 'receptionist', 'patient'] },
  '/records': { view: 'records', title: 'Medical Records & EMR', requiresAuth: true, allowedRoles: ['admin', 'doctor', 'nurse', 'patient'] },
  '/pharmacy': { view: 'pharmacy', title: 'Pharmacy & Inventory', requiresAuth: true, allowedRoles: ['admin', 'pharmacist'] },
  '/laboratory': { view: 'laboratory', title: 'Lab Reports & Tests', requiresAuth: true, allowedRoles: ['admin', 'lab', 'doctor', 'patient'] },
  '/billing': { view: 'billing', title: 'Invoices & Billing', requiresAuth: true, allowedRoles: ['admin', 'receptionist', 'patient'] },
  '/staff': { view: 'staff', title: 'Staff Directory', requiresAuth: true, allowedRoles: ['admin'] },
  '/reports': { view: 'reports', title: 'Reports & Analytics', requiresAuth: true, allowedRoles: ['admin'] },
  '/settings': { view: 'settings', title: 'Account Settings', requiresAuth: true },
  
  // Error States
  '/403': { view: 'error403', title: 'Access Denied' },
  '/404': { view: 'error404', title: 'Page Not Found' }
};

// Parse current URL path and query parameters
const parseLocation = () => {
  const hash = window.location.hash.slice(1) || '/';
  const [path, queryString] = hash.split('?');
  
  // Extract parameters
  const params = {};
  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, val] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(val || '');
    }
  }
  
  return { path, params };
};

// Client-side Router Class
class Router {
  constructor() {
    this.viewModules = {};
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  // Register view modules
  registerView(name, renderFunc) {
    this.viewModules[name] = renderFunc;
  }

  // Active user details
  getUser() {
    try {
      const userJSON = localStorage.getItem('userInfo');
      return userJSON ? JSON.parse(userJSON) : null;
    } catch (e) {
      return null;
    }
  }

  // Handle route switching
  async handleRoute() {
    const { path, params } = parseLocation();
    let route = routes[path];

    // Fallback to 404
    if (!route) {
      route = routes['/404'];
    }

    const user = this.getUser();
    const token = getAccessToken();

    // 1. Authentication Check
    if (route.requiresAuth && !token) {
      console.log(`Route ${path} requires authentication. Redirecting to login.`);
      window.location.hash = '#/login';
      return;
    }

    // 2. Authorization Role Check
    if (route.requiresAuth && route.allowedRoles && (!user || !route.allowedRoles.includes(user.role))) {
      console.log(`User role '${user?.role}' not allowed. Redirecting to 403.`);
      window.location.hash = '#/403';
      return;
    }

    // 3. Document Title Update
    document.title = `MedCare Plus — ${route.title}`;

    // 4. Layout Shell Switching
    const appShell = document.getElementById('app-shell');
    const publicShell = document.getElementById('public-shell');

    if (route.requiresAuth || path === '/403' || path === '/404') {
      // Show main authenticated dashboard shell
      if (appShell && publicShell) {
        publicShell.style.display = 'none';
        appShell.style.display = 'flex';
      }
      this.updateSidebarActiveState(path);
      this.updateTopbarHeader(route.title);
      
      // Render View in Main Container
      await this.renderView(route.view, document.getElementById('content-area'), params);
    } else {
      // Show guest public/auth shell
      if (appShell && publicShell) {
        appShell.style.display = 'none';
        publicShell.style.display = 'block';
      }
      // Render View in Public Container
      await this.renderView(route.view, document.getElementById('public-content-area'), params);
    }
    
    // Refresh Lucide Icons after rendering
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Update navigation highlights
  updateSidebarActiveState(path) {
    const items = document.querySelectorAll('.sidebar-item');
    items.forEach(item => {
      const link = item.querySelector('a');
      if (link && link.getAttribute('href') === `#${path}`) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Set Topbar Header title
  updateTopbarHeader(title) {
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.innerText = title;
  }

  // Render view template
  async renderView(viewName, mountTarget, params) {
    if (!mountTarget) return;

    // Show loading skeleton/spinner state
    mountTarget.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading view...</p>
      </div>
    `;

    try {
      const renderFunc = this.viewModules[viewName];
      if (renderFunc) {
        // Run view renderer
        await renderFunc(mountTarget, params);
        
        // Execute a subtle entry animation using GSAP
        if (window.gsap) {
          window.gsap.fromTo(mountTarget.children, 
            { opacity: 0, y: 15 }, 
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", stagger: 0.05 }
          );
        }
      } else {
        mountTarget.innerHTML = `
          <div style="padding: var(--space-lg); text-align: center;">
            <h3>View not loaded yet</h3>
            <p>Module '${viewName}' is missing or not registered.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error(`Rendering view '${viewName}' failed:`, error);
      mountTarget.innerHTML = `
        <div class="empty-state">
          <i data-lucide="alert-octagon" class="empty-state-icon" style="color: var(--status-danger)"></i>
          <h3 class="empty-state-title">An error occurred</h3>
          <p class="empty-state-desc">${error.message || 'Could not load page content.'}</p>
          <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

const router = new Router();
export default router;
