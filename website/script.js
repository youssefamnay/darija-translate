const translateBtn = document.getElementById('translateBtn');
const originalTextarea = document.getElementById('original');
const translatedTextarea = document.getElementById('translated');
const statusDiv = document.getElementById('status');
const copyBtn = document.getElementById('copyBtn');
const speakBtn = document.getElementById('speakBtn');
const micBtn = document.getElementById('micBtn');

const API_URL = "/darija-translator-service/api/translate";
const AUTH_API_URL = "http://localhost:3000/api/auth"; // Explicitly point to backend for auth

// Auth Logic
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Init Auth UI
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userProfile = document.getElementById('user-profile');
    const userEmail = document.getElementById('user-email');

    if (authToken && localStorage.getItem('userEmail')) {
        authButtons.style.display = 'none';
        userProfile.style.display = 'flex';
        userEmail.textContent = localStorage.getItem('userEmail');
    } else {
        authButtons.style.display = 'block';
        userProfile.style.display = 'none';
    }
}

updateAuthUI();

// Modal Logic
const modal = document.getElementById('auth-modal');
const loginBtnNav = document.getElementById('loginBtnNav');
const registerBtnNav = document.getElementById('registerBtnNav');
const closeModal = document.querySelector('.close-modal');
const modalTitle = document.getElementById('modal-title');
const submitBtn = document.getElementById('submit-auth-btn');
const switchLink = document.getElementById('switch-auth-link');
const switchText = document.getElementById('switch-text');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');

let isLoginMode = true;

function openModal(login = true) {
    isLoginMode = login;
    modal.style.display = 'flex';
    updateModalContent();
    authError.style.display = 'none';
    authForm.reset();
}

function updateModalContent() {
    if (isLoginMode) {
        modalTitle.textContent = "Connexion";
        submitBtn.textContent = "Se connecter";
        switchText.textContent = "Pas encore de compte ?";
        switchLink.textContent = "Créer un compte";
    } else {
        modalTitle.textContent = "Inscription";
        submitBtn.textContent = "S'inscrire";
        switchText.textContent = "Déjà un compte ?";
        switchLink.textContent = "Se connecter";
    }
}

loginBtnNav.addEventListener('click', () => openModal(true));
registerBtnNav.addEventListener('click', () => openModal(false));
closeModal.addEventListener('click', () => modal.style.display = 'none');
window.onclick = (event) => {
    if (event.target == modal) modal.style.display = 'none';
}

switchLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    updateModalContent();
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    authToken = null;
    updateAuthUI();
});

// Submit Form
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    authError.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = "Chargement...";

    const endpoint = isLoginMode ? '/login' : '/register';

    try {
        const response = await fetch(`${AUTH_API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur inconnue');
        }

        // Success
        if (isLoginMode || data.token) {
            // Login or Auto-login after register
            // Note: Register in our simplified flow might assume we need to login separately OR return token directly.
            // Our backend returns { message, userId, email } for register, NOT token yet (unless updated).
            // Let's check backend... ah, simplified backend returns just message. 
            // So for register, we switch to login mode or auto-login.

            if (isLoginMode) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userEmail', data.user.email);
                authToken = data.token;
                updateAuthUI();
                modal.style.display = 'none';
            } else {
                // Register success -> Auto login attempt
                const loginResp = await fetch(`${AUTH_API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const loginData = await loginResp.json();

                if (loginData.token) {
                    localStorage.setItem('authToken', loginData.token);
                    localStorage.setItem('userEmail', loginData.user.email);
                    authToken = loginData.token;
                    updateAuthUI();
                    modal.style.display = 'none';
                } else {
                    // Fallback if auto-login fails
                    isLoginMode = true;
                    updateModalContent();
                    alert("Compte créé ! Veuillez vous connecter.");
                }
            }
        }

    } catch (error) {
        authError.textContent = error.message;
        authError.style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        updateModalContent(); // Restore button text
    }
});

// Char counter
originalTextarea.addEventListener('input', () => {
    const count = originalTextarea.value.length;
    document.querySelector('.char-count').textContent = `${count} / 500`;
});

// Translation Logic
translateBtn.addEventListener('click', async () => {
    const text = originalTextarea.value.trim();
    if (!text) return;

    statusDiv.textContent = "Traduction en cours...";
    translateBtn.disabled = true;
    translateBtn.innerHTML = `<span>TRADUCTION...</span>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) throw new Error("Erreur serveur");

        const data = await response.json();
        translatedTextarea.value = data.translation || "Erreur...";
        statusDiv.textContent = "";

    } catch (error) {
        console.error(error);
        statusDiv.textContent = "Erreur de connexion au serveur local.";
        statusDiv.style.color = "red";
    } finally {
        translateBtn.disabled = false;
        translateBtn.innerHTML = `<span>TRADUIRE MAINTENANT</span>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>`;
    }
});

// Copy Logic
copyBtn.addEventListener('click', () => {
    const text = translatedTextarea.value;
    if (text) {
        navigator.clipboard.writeText(text);
        const originalIcon = copyBtn.innerHTML;
        copyBtn.innerHTML = `<svg width="20" height="20" fill="none" stroke="green" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
        setTimeout(() => copyBtn.innerHTML = originalIcon, 1500);
    }
});

// TTS Logic (Audio)
speakBtn.addEventListener('click', () => {
    const text = translatedTextarea.value;
    if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar';
        window.speechSynthesis.speak(utterance);
    }
});

// STT Logic (Microphone)
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        micBtn.style.color = "red";
        statusDiv.textContent = "Écoute en cours...";
    };

    recognition.onend = () => {
        micBtn.style.color = "";
        statusDiv.textContent = "";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        originalTextarea.value = transcript;
    };

    micBtn.addEventListener('click', () => recognition.start());
} else {
    micBtn.style.display = 'none';
}
