// view.js
function showAlert(message) {
    alert(message);
}

function redirectToPage(page) {
    window.location.href = page;
}

function getFormData() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    return { name, email, password, role };
}

export { showAlert, redirectToPage, getFormData };