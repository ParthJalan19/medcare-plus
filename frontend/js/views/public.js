import { fetchAPI, setAccessToken } from '../api.js';
import { displayFormError, clearFormErrors } from '../ui.js';

const validateEmail = (email) => {
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

// 1. PUBLIC HOME VIEW
export const publicHome = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; background-color: var(--bg-secondary);">
      <!-- Header -->
      <header style="background-color: var(--bg-primary); border-bottom: var(--border-hairline); padding: var(--space-md) var(--space-lg); display: flex; justify-content: space-between; align-items: center;">
        <div class="brand">
          <i data-lucide="activity" class="brand-icon"></i>
          <span style="color: var(--primary); font-weight: 700; font-size: 1.25rem;">medcare plus</span>
        </div>
        <nav style="display: flex; gap: var(--space-md);">
          <a href="#/" class="auth-link" style="color: var(--text-primary);">Home</a>
          <a href="#/about" class="auth-link" style="color: var(--text-primary);">About</a>
          <a href="#/services" class="auth-link" style="color: var(--text-primary);">Services</a>
          <a href="#/doctors" class="auth-link" style="color: var(--text-primary);">Specialists</a>
          <a href="#/contact" class="auth-link" style="color: var(--text-primary);">Contact</a>
        </nav>
        <div style="display: flex; gap: var(--space-xs);">
          <a href="#/login" class="btn btn-secondary">Login</a>
          <a href="#/register" class="btn btn-primary">Register</a>
        </div>
      </header>

      <!-- Hero Section -->
      <section style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: var(--space-xl) var(--space-lg);">
        <div style="max-width: 800px; margin: 0 auto;">
          <h2 style="font-size: 3rem; font-weight: 700; color: var(--text-primary); line-height: 1.2; margin-bottom: var(--space-md);">
            Your health, our priority.<br>Smart clinical management.
          </h2>
          <p style="font-size: 1.1rem; color: var(--text-secondary); margin-bottom: var(--space-lg); line-height: 1.6;">
            MedCare Plus connects patients, doctors, nurses, pharmacists, and lab teams in one seamless, highly secure ecosystem. Book appointments, track EMR records, and handle billing with ease.
          </p>
          <div style="display: flex; gap: var(--space-md); justify-content: center;">
            <a href="#/register" class="btn btn-primary" style="padding: 12px 28px; font-size: 1rem;">Book your checkup</a>
            <a href="#/login" class="btn btn-secondary" style="padding: 12px 28px; font-size: 1rem;">Portal login</a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer style="background-color: var(--bg-primary); border-top: var(--border-hairline); padding: var(--space-lg) var(--space-md); text-align: center; color: var(--text-secondary); font-size: 0.85rem;">
        <p>&copy; 2026 MedCare Plus. All rights reserved. Sentence case UI standards enforced.</p>
      </footer>
    </div>
  `;
};

// 2. PUBLIC ABOUT VIEW
export const publicAbout = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; background-color: var(--bg-secondary);">
      <header style="background-color: var(--bg-primary); border-bottom: var(--border-hairline); padding: var(--space-md) var(--space-lg); display: flex; justify-content: space-between; align-items: center;">
        <div class="brand"><i data-lucide="activity" class="brand-icon"></i><span style="color: var(--primary); font-weight:700;">medcare plus</span></div>
        <nav style="display: flex; gap: var(--space-md);">
          <a href="#/" class="auth-link" style="color: var(--text-primary);">Home</a>
          <a href="#/about" class="auth-link" style="color: var(--primary);">About</a>
          <a href="#/services" class="auth-link" style="color: var(--text-primary);">Services</a>
          <a href="#/doctors" class="auth-link" style="color: var(--text-primary);">Specialists</a>
          <a href="#/contact" class="auth-link" style="color: var(--text-primary);">Contact</a>
        </nav>
        <a href="#/login" class="btn btn-primary">Portal login</a>
      </header>
      <main style="flex-grow: 1; max-width: 800px; margin: 50px auto; padding: var(--space-lg); background-color: var(--bg-primary); border-radius: var(--radius-lg); border: var(--border-hairline);">
        <h2 style="font-size: 2rem; margin-bottom: var(--space-md);">About MedCare Plus</h2>
        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--space-md);">
          MedCare Plus is a leading healthcare administration platform designed to connect clinicians, laboratory technicians, pharmacy assistants, receptionists, and patients.
        </p>
        <p style="color: var(--text-secondary); line-height: 1.6;">
          Our focus is on security, speed, and simplicity. Powered by role-based authorization rules and structured database tracking, we ensure records are securely managed and easily accessed by authorized personnel.
        </p>
      </main>
    </div>
  `;
};

// 3. PUBLIC SERVICES VIEW
export const publicServices = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; background-color: var(--bg-secondary);">
      <header style="background-color: var(--bg-primary); border-bottom: var(--border-hairline); padding: var(--space-md) var(--space-lg); display: flex; justify-content: space-between; align-items: center;">
        <div class="brand"><i data-lucide="activity" class="brand-icon"></i><span style="color: var(--primary); font-weight:700;">medcare plus</span></div>
        <nav style="display: flex; gap: var(--space-md);">
          <a href="#/" class="auth-link" style="color: var(--text-primary);">Home</a>
          <a href="#/about" class="auth-link" style="color: var(--text-primary);">About</a>
          <a href="#/services" class="auth-link" style="color: var(--primary);">Services</a>
          <a href="#/doctors" class="auth-link" style="color: var(--text-primary);">Specialists</a>
          <a href="#/contact" class="auth-link" style="color: var(--text-primary);">Contact</a>
        </nav>
        <a href="#/login" class="btn btn-primary">Portal login</a>
      </header>
      <main style="flex-grow: 1; max-width: 900px; margin: 50px auto; padding: var(--space-lg);">
        <h2 style="font-size: 2rem; margin-bottom: var(--space-lg); text-align: center;">Our clinical services</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md);">
          <div style="background-color: var(--bg-primary); padding: var(--space-md); border-radius: var(--radius-md); border: var(--border-hairline);">
            <i data-lucide="heart" style="color: var(--primary); margin-bottom: var(--space-xs);"></i>
            <h4 style="margin-bottom: 8px;">Cardiology</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">Comprehensive cardiovascular screenings, ECG analysis, and hypertension management.</p>
          </div>
          <div style="background-color: var(--bg-primary); padding: var(--space-md); border-radius: var(--radius-md); border: var(--border-hairline);">
            <i data-lucide="baby" style="color: var(--primary); margin-bottom: var(--space-xs);"></i>
            <h4 style="margin-bottom: 8px;">Pediatrics</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">Infant checkups, immunizations, and developmental health consulting.</p>
          </div>
          <div style="background-color: var(--bg-primary); padding: var(--space-md); border-radius: var(--radius-md); border: var(--border-hairline);">
            <i data-lucide="flask-conical" style="color: var(--primary); margin-bottom: var(--space-xs);"></i>
            <h4 style="margin-bottom: 8px;">Lab diagnostics</h4>
            <p style="font-size: 0.85rem; color: var(--text-secondary);">On-site blood testing, lipid profiles, and PDF report deliveries.</p>
          </div>
        </div>
      </main>
    </div>
  `;
};

// 4. PUBLIC CONTACT VIEW
export const publicContact = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; background-color: var(--bg-secondary);">
      <header style="background-color: var(--bg-primary); border-bottom: var(--border-hairline); padding: var(--space-md) var(--space-lg); display: flex; justify-content: space-between; align-items: center;">
        <div class="brand"><i data-lucide="activity" class="brand-icon"></i><span style="color: var(--primary); font-weight:700;">medcare plus</span></div>
        <nav style="display: flex; gap: var(--space-md);">
          <a href="#/" class="auth-link" style="color: var(--text-primary);">Home</a>
          <a href="#/about" class="auth-link" style="color: var(--text-primary);">About</a>
          <a href="#/services" class="auth-link" style="color: var(--text-primary);">Services</a>
          <a href="#/doctors" class="auth-link" style="color: var(--text-primary);">Specialists</a>
          <a href="#/contact" class="auth-link" style="color: var(--primary);">Contact</a>
        </nav>
        <a href="#/login" class="btn btn-primary">Portal login</a>
      </header>
      <main style="flex-grow: 1; max-width: 600px; margin: 50px auto; padding: var(--space-lg); background-color: var(--bg-primary); border-radius: var(--radius-lg); border: var(--border-hairline);">
        <h2 style="font-size: 1.75rem; margin-bottom: var(--space-md);">Contact our team</h2>
        <form id="contact-form">
          <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" class="form-input" placeholder="Your full name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" placeholder="Your email address" required>
          </div>
          <div class="form-group">
            <label class="form-label">Message</label>
            <textarea class="form-input" style="height: 100px; resize: none;" placeholder="Explain your inquiry" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">Send message</button>
        </form>
      </main>
    </div>
  `;

  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Message sent successfully. We will get back to you shortly.');
    window.location.hash = '#/';
  });
};

// 5. PUBLIC DOCTORS LIST VIEW
export const publicDoctors = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; background-color: var(--bg-secondary);">
      <header style="background-color: var(--bg-primary); border-bottom: var(--border-hairline); padding: var(--space-md) var(--space-lg); display: flex; justify-content: space-between; align-items: center;">
        <div class="brand"><i data-lucide="activity" class="brand-icon"></i><span style="color: var(--primary); font-weight:700;">medcare plus</span></div>
        <nav style="display: flex; gap: var(--space-md);">
          <a href="#/" class="auth-link" style="color: var(--text-primary);">Home</a>
          <a href="#/about" class="auth-link" style="color: var(--text-primary);">About</a>
          <a href="#/services" class="auth-link" style="color: var(--text-primary);">Services</a>
          <a href="#/doctors" class="auth-link" style="color: var(--primary);">Specialists</a>
          <a href="#/contact" class="auth-link" style="color: var(--text-primary);">Contact</a>
        </nav>
        <a href="#/login" class="btn btn-primary">Portal login</a>
      </header>
      <main style="flex-grow: 1; max-width: 900px; margin: 50px auto; padding: var(--space-lg);">
        <h2 style="font-size: 2rem; margin-bottom: var(--space-lg); text-align: center;">Our specialists</h2>
        <div id="public-doctors-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-lg);">
          <!-- Dynamic cards or mock card here -->
          <div style="background-color: var(--bg-primary); padding: var(--space-lg); border-radius: var(--radius-md); border: var(--border-hairline); display: flex; gap: var(--space-md); align-items: center;">
            <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=120" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover;">
            <div>
              <h4 style="margin-bottom: 4px;">Dr. Gregory House</h4>
              <p style="font-size: 0.85rem; color: var(--primary); font-weight: 600; margin-bottom: 4px;">Diagnostic Medicine & Cardiology</p>
              <p style="font-size: 0.75rem; color: var(--text-secondary);">Availability: Mon, Wed, Fri</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
};

// 6. AUTH LOGIN VIEW
export const authLogin = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <i data-lucide="activity" class="brand-icon"></i>
            <span>medcare plus</span>
          </div>
          <h2 class="auth-title">Welcome back</h2>
          <p class="auth-subtitle">Login to your portal dashboard</p>
        </div>

        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" id="login-email" class="form-input" placeholder="you@example.com" required autocomplete="email">
          </div>
          
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" style="margin-bottom: 0;">Password</label>
              <a href="#/forgot-password" class="auth-link" style="font-size: 0.8rem;">Forgot password?</a>
            </div>
            <input type="password" id="login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
          </div>

          <button type="submit" id="login-submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
            <span>Log in</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Don't have an account?</span>
          <a href="#/register" class="auth-link">Register patient profile</a>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!validateEmail(email)) {
      displayFormError(form, 'Please enter a valid email address.');
      return;
    }

    const submitBtn = document.getElementById('login-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-bottom: 0;"></div>';

    const res = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success) {
      setAccessToken(res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      localStorage.setItem('userRole', res.data.user.role);
      
      // Redirect to dashboard
      window.location.hash = '#/dashboard';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Log in</span>';
      displayFormError(form, res.error || 'Invalid credentials');
    }
  });
};

// 7. AUTH REGISTER VIEW
export const authRegister = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div class="auth-page" style="padding: 40px 20px;">
      <div class="auth-card" style="max-width: 500px;">
        <div class="auth-header">
          <div class="auth-logo">
            <i data-lucide="activity" class="brand-icon"></i>
            <span>medcare plus</span>
          </div>
          <h2 class="auth-title">Register patient account</h2>
          <p class="auth-subtitle">Create your personal medical portal profile</p>
        </div>

        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Full name</label>
            <input type="text" id="register-name" class="form-input" placeholder="John Doe" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" id="register-email" class="form-input" placeholder="john@example.com" required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" id="register-password" class="form-input" placeholder="Min. 6 characters" required>
            </div>
            <div class="form-group">
              <label class="form-label">Confirm password</label>
              <input type="password" id="register-confirm-password" class="form-input" placeholder="Repeat password" required>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-md);">
            <div class="form-group">
              <label class="form-label">Date of birth</label>
              <input type="date" id="register-dob" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select id="register-gender" class="form-input" required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Phone number</label>
            <input type="tel" id="register-phone" class="form-input" placeholder="123-456-7890" required>
          </div>

          <button type="submit" id="register-submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; margin-top: 10px;">
            <span>Create account</span>
          </button>
        </form>

        <div class="auth-footer">
          <span>Already have an account?</span>
          <a href="#/login" class="auth-link">Log in here</a>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const DOB = document.getElementById('register-dob').value;
    const gender = document.getElementById('register-gender').value;
    const phone = document.getElementById('register-phone').value.trim();

    if (!validateEmail(email)) {
      displayFormError(form, 'Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      displayFormError(form, 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      displayFormError(form, 'Passwords do not match.');
      return;
    }

    const submitBtn = document.getElementById('register-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-bottom: 0;"></div>';

    const res = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, DOB, gender, phone })
    });

    if (res.success) {
      setAccessToken(res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      localStorage.setItem('userRole', res.data.user.role);
      window.location.hash = '#/dashboard';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Create account</span>';
      displayFormError(form, res.error || 'Registration failed');
    }
  });
};

// 8. AUTH FORGOT PASSWORD VIEW
export const authForgotPassword = async (mountTarget) => {
  mountTarget.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <i data-lucide="activity" class="brand-icon"></i>
            <span>medcare plus</span>
          </div>
          <h2 class="auth-title">Forgot password</h2>
          <p class="auth-subtitle">We will send you instructions to reset it</p>
        </div>

        <form id="forgot-form">
          <div class="form-group">
            <label class="form-label">Email address</label>
            <input type="email" id="forgot-email" class="form-input" placeholder="you@example.com" required>
          </div>

          <button type="submit" id="forgot-submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
            <span>Send reset link</span>
          </button>
        </form>

        <div class="auth-footer">
          <a href="#/login" class="auth-link"><i data-lucide="arrow-left" style="width: 12px; height: 12px; display: inline; vertical-align: middle; margin-right: 4px;"></i>Back to login</a>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('forgot-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const email = document.getElementById('forgot-email').value.trim();

    if (!validateEmail(email)) {
      displayFormError(form, 'Please enter a valid email address.');
      return;
    }

    const submitBtn = document.getElementById('forgot-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-bottom: 0;"></div>';

    const res = await fetchAPI('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });

    if (res.success) {
      mountTarget.innerHTML = `
        <div class="auth-page">
          <div class="auth-card" style="text-align: center;">
            <div class="auth-logo"><i data-lucide="mail" class="brand-icon" style="color: var(--primary);"></i></div>
            <h2 class="auth-title" style="margin-top: 10px;">Check your email</h2>
            <p class="auth-subtitle" style="margin-bottom: var(--space-lg);">A reset link was generated and logged. (Check backend console for ethereal link)</p>
            <a href="#/login" class="btn btn-primary" style="width: 100%; justify-content: center;">Return to login</a>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Send reset link</span>';
      displayFormError(form, res.error || 'Could not send reset email.');
    }
  });
};

// 9. AUTH RESET PASSWORD VIEW
export const authResetPassword = async (mountTarget, params) => {
  const token = params.token || '';
  
  if (!token) {
    mountTarget.innerHTML = `
      <div class="auth-page">
        <div class="auth-card" style="text-align: center;">
          <h2 class="auth-title">Missing token</h2>
          <p class="auth-subtitle" style="margin-bottom: var(--space-lg);">This password reset link is invalid or expired.</p>
          <a href="#/login" class="btn btn-primary">Return to login</a>
        </div>
      </div>
    `;
    return;
  }

  mountTarget.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <i data-lucide="activity" class="brand-icon"></i>
            <span>medcare plus</span>
          </div>
          <h2 class="auth-title">Reset your password</h2>
          <p class="auth-subtitle">Choose a strong new password</p>
        </div>

        <form id="reset-form">
          <div class="form-group">
            <label class="form-label">New password</label>
            <input type="password" id="reset-password" class="form-input" placeholder="At least 6 characters" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Confirm new password</label>
            <input type="password" id="reset-confirm" class="form-input" placeholder="Repeat new password" required>
          </div>

          <button type="submit" id="reset-submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px;">
            <span>Update password</span>
          </button>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById('reset-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const password = document.getElementById('reset-password').value;
    const confirm = document.getElementById('reset-confirm').value;

    if (password.length < 6) {
      displayFormError(form, 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirm) {
      displayFormError(form, 'Passwords do not match.');
      return;
    }

    const submitBtn = document.getElementById('reset-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; border-width: 2px; margin-bottom: 0;"></div>';

    const res = await fetchAPI('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });

    if (res.success) {
      setAccessToken(res.data.token);
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));
      localStorage.setItem('userRole', res.data.user.role);
      window.location.hash = '#/dashboard';
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Update password</span>';
      displayFormError(form, res.error || 'Password reset failed');
    }
  });
};
