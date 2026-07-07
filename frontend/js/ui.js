// Form validation alert display
export const displayFormError = (form, errorMsg) => {
  let alertBox = form.querySelector('.form-alert');
  if (!alertBox) {
    alertBox = document.createElement('div');
    alertBox.className = 'form-alert badge badge-danger';
    alertBox.style.width = '100%';
    alertBox.style.textAlign = 'center';
    alertBox.style.padding = '10px';
    alertBox.style.marginBottom = '15px';
    alertBox.style.borderRadius = '8px';
    form.insertBefore(alertBox, form.firstChild);
  }
  alertBox.innerText = errorMsg;
  
  if (window.gsap) {
    window.gsap.fromTo(alertBox, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3 });
  }
};

// Form validation alert clear
export const clearFormErrors = (form) => {
  const alertBox = form.querySelector('.form-alert');
  if (alertBox) alertBox.remove();
  
  const fields = form.querySelectorAll('.form-input');
  fields.forEach(f => {
    f.classList.remove('is-invalid');
    const msg = f.parentNode.querySelector('.invalid-feedback');
    if (msg) msg.remove();
  });
};
