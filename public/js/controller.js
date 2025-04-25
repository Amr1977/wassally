// controller.js
import { signupUser, signinUser, saveUserToLocalStorage, getUserFromLocalStorage } from './model.js';
import { showAlert, redirectToPage, getFormData } from './view.js';

// Signup Controller
function signup(e) {
    e.preventDefault();
    const userData = getFormData();

    signupUser(userData).then(() => {
        showAlert("تم إنشاء الحساب بنجاح!");
        redirectToPage("signin.html");
    }).catch(err => {
        showAlert("حدث خطأ: " + err.message);
    });
}

// Signin Controller
function signin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signinUser(email, password).then((userCredential) => {
        const user = userCredential.user;
        saveUserToLocalStorage({ uid: user.uid, email: user.email });
        showAlert("تم تسجيل الدخول بنجاح!");
        redirectToPage("dashboard.html");
    }).catch(err => {
        showAlert("حدث خطأ: " + err.message);
    });
}

// Check if user is already logged in
function checkIfLoggedIn() {
    const user = getUserFromLocalStorage();
    if (user) {
        redirectToPage("dashboard.html");
    }
}

export { signup, signin, checkIfLoggedIn };