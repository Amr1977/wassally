// view.js

// عرض التنبيه
function showAlert(message) {
    alert(message);
}

// التوجيه إلى صفحة أخرى
function redirectToPage(page) {
    window.location.href = page;
}

// التحقق من صحة البريد الإلكتروني
function validateEmail(email) {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailPattern.test(email);
}

// الحصول على بيانات النموذج
function getFormData() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    // تحقق من وجود المدخلات
    if (!name || !email || !password || !role) {
        showAlert("يرجى ملء جميع الحقول.");
        return null;
    }

    // تحقق من صحة البريد الإلكتروني
    if (!validateEmail(email)) {
        showAlert("يرجى إدخال بريد إلكتروني صالح.");
        return null;
    }

    // إذا كانت البيانات صالحة، إرجاعها
    return { name, email, password, role };
}

// تصدير الدوال
export { showAlert, redirectToPage, getFormData };