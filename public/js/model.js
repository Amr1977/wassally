// model.js
const firebaseConfig = {
    apiKey: "AIzaSyBXyTzYT_kjwcibZo3zXQrhOdPyUksodig",
    authDomain: "wassally25.firebaseapp.com",
    databaseURL: "https://wassally25-default-rtdb.firebaseio.com",
    projectId: "wassally25",
    storageBucket: "wassally25.firebasestorage.app",
    messagingSenderId: "673929758317",
    appId: "1:673929758317:web:de4fe369507fb58d492164",
    measurementId: "G-W5Z57HVDCK"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function signupUser(userData) {
    const userId = db.ref().child("users").push().key;
    return db.ref("users/" + userId).set(userData);
}

function signinUser(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
}

function saveUserToLocalStorage(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

function getUserFromLocalStorage() {
    return JSON.parse(localStorage.getItem('user'));
}

export { signupUser, signinUser, saveUserToLocalStorage, getUserFromLocalStorage };