// controller.js
import {
    signupUser,
    signinUser,
    saveUserToLocalStorage,
    getUserFromLocalStorage,
    db
} from './model.js';

import {
    showAlert,
    redirectToPage,
    getFormData
} from './view.js';

import {
    get,
    ref,
    child
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

import {
    createUserWithEmailAndPassword,
    getAuth
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const auth = getAuth();

// Signup Controller
function signup(e) {
    e.preventDefault();
    const userData = getFormData();
    const { email, password, ...rest } = userData;

    createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            const user = userCredential.user;
            const fullUserData = {
                uid: user.uid,
                email: user.email,
                ...rest
            };
            return signupUser(fullUserData);
        })
        .then(() => {
            showAlert("تم إنشاء الحساب بنجاح!");
            redirectToPage("signin.html");
        })
        .catch(err => {
            showAlert("حدث خطأ أثناء إنشاء الحساب: " + err.message);
        });
}

// Signin Controller
function signin(e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    signinUser(email, password)
        .then(userCredential => {
            const user = userCredential.user;
            return get(child(ref(db), "users"));
        })
        .then(snapshot => {
            let userData = null;
            snapshot.forEach(childSnapshot => {
                const value = childSnapshot.val();
                if (value.email === email) {
                    userData = value;
                }
            });
            if (userData) {
                saveUserToLocalStorage(userData);
                showAlert("تم تسجيل الدخول بنجاح!");
                redirectToPage("dashboard.html");
            } else {
                throw new Error("لم يتم العثور على بيانات المستخدم");
            }
        })
        .catch(err => {
            showAlert("حدث خطأ أثناء تسجيل الدخول: " + err.message);
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