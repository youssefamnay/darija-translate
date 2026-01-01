const API_URL = 'http://localhost:3000/api';

// Tab switching
const tabs = document.querySelectorAll('.tab');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (targetTab === 'login') {
            loginSection.classList.add('active');
            registerSection.classList.remove('active');
        } else {
            registerSection.classList.add('active');
            loginSection.classList.remove('active');
        }

        hideMessages();
    });
});

// Password strength indicator
const registerPassword = document.getElementById('register-password');
const passwordStrength = document.getElementById('password-strength');
const passwordStrengthBar = document.getElementById('password-strength-bar');

registerPassword.addEventListener('input', () => {
    const password = registerPassword.value;

    if (password.length === 0) {
        passwordStrength.classList.remove('show');
        return;
    }

    passwordStrength.classList.add('show');

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    passwordStrengthBar.className = 'password-strength-bar';

    if (strength <= 2) {
        passwordStrengthBar.classList.add('strength-weak');
    } else if (strength <= 4) {
        passwordStrengthBar.classList.add('strength-medium');
    } else {
        passwordStrengthBar.classList.add('strength-strong');
    }
});

// Message functions
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');

    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.classList.add('show');

    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 5000);
}

function hideMessages() {
    document.getElementById('error-message').classList.remove('show');
    document.getElementById('success-message').classList.remove('show');
}

// Login form
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    loginBtn.disabled = true;
    loginBtn.classList.add('btn-loading');
    loginBtn.textContent = '';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            if (data.needsVerification) {
                showError('Veuillez vérifier votre email avant de vous connecter.');
            } else {
                showError(data.error || 'Erreur de connexion');
            }
            return;
        }

        // Save token
        await chrome.storage.local.set({
            authToken: data.token,
            user: data.user,
            rememberMe: rememberMe
        });

        showSuccess('Connexion réussie ! Redirection...');

        // Redirect to popup
        setTimeout(() => {
            window.location.href = 'popup.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showError('Erreur de connexion au serveur. Vérifiez que le backend est lancé.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.classList.remove('btn-loading');
        loginBtn.textContent = 'Se connecter';
    }
});

// Register form
const registerForm = document.getElementById('register-form');
const registerBtn = document.getElementById('register-btn');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    // Validate passwords match
    if (password !== passwordConfirm) {
        showError('Les mots de passe ne correspondent pas');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    registerBtn.disabled = true;
    registerBtn.classList.add('btn-loading');
    registerBtn.textContent = '';

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showError(data.error || 'Erreur lors de l\'inscription');
            return;
        }

        showSuccess('Compte créé ! Vérifiez votre email pour activer votre compte.');

        // Clear form
        registerForm.reset();
        passwordStrength.classList.remove('show');

        // Switch to login tab after 2 seconds
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('login-email').value = email;
        }, 2000);

    } catch (error) {
        console.error('Register error:', error);
        showError('Erreur de connexion au serveur. Vérifiez que le backend est lancé.');
    } finally {
        registerBtn.disabled = false;
        registerBtn.classList.remove('btn-loading');
        registerBtn.textContent = 'Créer mon compte';
    }
});

// Forgot password
document.getElementById('forgot-password-link').addEventListener('click', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;

    if (!email) {
        showError('Veuillez entrer votre email');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        showSuccess(data.message || 'Email de réinitialisation envoyé');

    } catch (error) {
        console.error('Forgot password error:', error);
        showError('Erreur lors de l\'envoi de l\'email');
    }
});

// Check if already logged in
chrome.storage.local.get(['authToken', 'user'], (result) => {
    if (result.authToken && result.user) {
        // Already logged in, redirect to popup
        window.location.href = 'popup.html';
    }
});
