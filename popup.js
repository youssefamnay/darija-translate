const translateBtn = document.getElementById('translateBtn');
const originalTextarea = document.getElementById('original');
const translatedTextarea = document.getElementById('translated');
const statusDiv = document.getElementById('status');
const copyBtn = document.getElementById('copyBtn');

// URL de ton service REST
const API_URL = "http://localhost:3000/api/translate";
const AUTH_API_URL = "http://localhost:3000/api/auth";

// Global auth state
let authToken = null;
let currentUser = null;

// Check authentication on load
async function checkAuth() {
    const result = await chrome.storage.local.get(['authToken', 'user']);

    if (!result.authToken || !result.user) {
        // Not logged in, redirect to auth page
        window.location.href = 'auth.html';
        return false;
    }

    authToken = result.authToken;
    currentUser = result.user;

    // Display user info
    displayUserInfo();

    return true;
}

function displayUserInfo() {
    const userSection = document.getElementById('user-section');
    const userAvatar = document.getElementById('user-avatar');
    const userEmail = document.getElementById('user-email');
    const africaBadge = document.getElementById('africa-badge');

    if (currentUser) {
        userSection.style.display = 'block';
        africaBadge.style.display = 'none';

        // Get initials from email
        const initials = currentUser.email.substring(0, 2).toUpperCase();
        userAvatar.textContent = initials;

        // Display email (truncate if too long)
        const email = currentUser.email;
        userEmail.textContent = email.length > 20 ? email.substring(0, 17) + '...' : email;
    }
}

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await chrome.storage.local.remove(['authToken', 'user']);
            window.location.href = 'auth.html';
        });
    }
});

// Initialize auth check
checkAuth();

// Fonction pour copier le texte
copyBtn.addEventListener('click', () => {
    const text = translatedTextarea.value;
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = 'Copié !';
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 1500);
        });
    }
});

// Fonction pour écouter le texte généré (TTS)
const speakBtn = document.getElementById('speakBtn');
speakBtn.addEventListener('click', () => {
    const text = translatedTextarea.value;
    if (text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar';
        window.speechSynthesis.speak(utterance);
    }
});

// Fonction pour dicter le texte source (STT)
const micBtn = document.getElementById('micBtn');
let recognition = null;

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Source est l'anglais

    recognition.onstart = () => {
        micBtn.innerHTML = `<span style="color:red; animation: blink 1s infinite;">●</span> Écoute...`;
        statusDiv.textContent = "Parlez maintenant...";
    };

    recognition.onend = () => {
        resetMicBtn();
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        originalTextarea.value = transcript;
        statusDiv.textContent = "";
        // Optionnel : lancer la traduction automatiquement
        // translateText(); 
    };

    recognition.onerror = (event) => {
        console.error("Erreur reconnaissance vocale:", event.error);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            statusDiv.textContent = "Permission requise. Ouverture des options...";
            // Ouvrir la page d'options pour demander la permission de manière persistante
            chrome.runtime.openOptionsPage();
        } else {
            statusDiv.textContent = "Erreur micro : " + event.error;
        }
        resetMicBtn();
    };
} else {
    micBtn.style.display = 'none';
    console.log("Web Speech API non supportée");
}

function resetMicBtn() {
    micBtn.innerHTML = `
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z">
            </path>
        </svg>
        Dicter`;
}

micBtn.addEventListener('click', () => {
    if (!recognition) return;

    // Si déjà en train d'enregistrer, on arrête ? (l'API gère ça souvent seule, mais bon)
    // Ici on démarre simplement
    try {
        recognition.start();
    } catch (e) {
        // Probablement déjà démarré
        recognition.stop();
    }
});

// Traduction
async function translateText() {
    statusDiv.textContent = "Traduction en cours...";
    translatedTextarea.value = "";

    // Récupérer le texte
    let textToTranslate = originalTextarea.value.trim();

    // Si vide, essayer de récupérer la sélection de l'onglet actif
    if (!textToTranslate) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && !tab.url.startsWith("chrome://")) {
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => window.getSelection().toString()
                });
                if (results && results[0] && results[0].result) {
                    textToTranslate = results[0].result;
                    originalTextarea.value = textToTranslate;
                }
            }
        } catch (e) {
            console.log("Impossible de lire la sélection", e);
        }
    }

    if (!textToTranslate) {
        statusDiv.textContent = "Veuillez saisir ou sélectionner du texte.";
        return;
    }

    try {
        const headers = { "Content-Type": "application/json" };

        // Add auth token if available
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ text: textToTranslate })
        });

        if (!response.ok) throw new Error("Erreur de connexion au serveur");

        const data = await response.json();
        const translation = data.translation || "Erreur de traduction";

        translatedTextarea.value = translation;
        statusDiv.textContent = "";

        // Sauvegarder dans l'historique
        addToHistory(textToTranslate, translation);

    } catch (error) {
        console.error(error);
        statusDiv.textContent = "Erreur : " + error.message;
        statusDiv.style.color = "#ef4444";
    }
}

// --- Gestion de l'historique ---
function addToHistory(source, translation) {
    chrome.storage.sync.get({ history: [] }, (items) => {
        let history = items.history;
        // Ajouter au début
        history.unshift({ source, translation, date: new Date().toLocaleTimeString() });
        // Garder les 10 derniers
        if (history.length > 10) history = history.slice(0, 10);

        chrome.storage.sync.set({ history }, displayHistory);
    });
}

function displayHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;

    chrome.storage.sync.get({ history: [] }, (items) => {
        list.innerHTML = '';
        if (items.history.length === 0) {
            list.innerHTML = '<div style="color:#9ca3af; text-align:center; padding:10px;">Aucun historique</div>';
            return;
        }

        items.history.forEach((item) => {
            const el = document.createElement('div');
            el.style.cssText = 'padding: 6px; border-bottom: 1px solid #f3f4f6; cursor: pointer; border-radius:4px;';
            el.onmouseover = () => el.style.background = '#f9fafb';
            el.onmouseout = () => el.style.background = 'transparent';

            el.innerHTML = `
                <div style="font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.source}</div>
                <div style="color:#6b7280; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">→ ${item.translation}</div>
            `;

            el.onclick = () => {
                originalTextarea.value = item.source;
                translatedTextarea.value = item.translation;
            };

            list.appendChild(el);
        });
    });
}

document.getElementById('clearHistory')?.addEventListener('click', () => {
    chrome.storage.sync.set({ history: [] }, displayHistory);
});

// Initialiser l'affichage de l'historique
document.addEventListener('DOMContentLoaded', displayHistory);

// Au chargement, essayer de pré-remplir avec la sélection
document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab && !tab.url.startsWith("chrome://")) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.getSelection().toString()
            }).then(results => {
                if (results && results[0] && results[0].result) {
                    originalTextarea.value = results[0].result;
                }
            }).catch(() => { });
        }
    });
});

translateBtn.addEventListener('click', translateText);
