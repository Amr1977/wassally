// view.js

// عرض التنبيه
function show_alert(message) {
    alert(message);
  }
  
  // التوجيه إلى صفحة أخرى
  function redirect_to_page(page) {
    window.location.href = page;
  }
  
  // التحقق من صحة البريد الإلكتروني
  function validate_email(email) {
    const email_pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return email_pattern.test(email);
  }
  
  // الحصول على بيانات النموذج
  function get_form_data() {
    const name = document.getElementById('name')?.value || '';
    const email = document.getElementById('email')?.value || '';
    const password = document.getElementById('password')?.value || '';
    const role = document.getElementById('role')?.value || '';
  
    if (!name || !email || !password || !role) {
      show_alert('يرجى ملء جميع الحقول.');
      return null;
    }
  
    if (!validate_email(email)) {
      show_alert('يرجى إدخال بريد إلكتروني صالح.');
      return null;
    }
  
    return { name, email, password, role };
  }
  
  // تصدير الدوال
  export { show_alert, redirect_to_page, validate_email, get_form_data };