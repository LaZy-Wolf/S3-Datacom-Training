const form = document.getElementById('signup');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const statusMessage = document.getElementById('status');

function showError(input, message) {
    document.getElementById(input.id + '-error').textContent = message;

    if (message) {
        input.setAttribute('aria-invalid', 'true');
    } else {
        input.removeAttribute('aria-invalid');
    }
}

form.addEventListener('submit', function(event) {
    event.preventDefault();
    statusMessage.textContent = '';

    const nameError = nameInput.value.trim() ? '' : 'Enter your full name.';
    const emailError = emailInput.validity.valid ? '' : 'Enter a valid email address.';
    const passwordError = passwordInput.value.length >= 8 ? '' : 'Enter at least 8 characters.';

    showError(nameInput, nameError);
    showError(emailInput, emailError);
    showError(passwordInput, passwordError);

    if (nameError) {
        nameInput.focus();
    } else if (emailError) {
        emailInput.focus();
    } else if (passwordError) {
        passwordInput.focus();
    } else {
        form.reset();
        statusMessage.textContent = 'Form accepted. This practice page does not create an account.';
    }
});
