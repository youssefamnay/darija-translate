// Sauvegarder les options
function saveOptions() {
    const floatingIcon = document.getElementById('floatingIcon').checked;

    chrome.storage.sync.set({
        floatingIcon: floatingIcon
    }, () => {
        const status = document.getElementById('status');
        status.textContent = 'Options enregistrées.';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
}

// Restaurer les options
function restoreOptions() {
    // Valeur par défaut : true
    chrome.storage.sync.get({
        floatingIcon: true
    }, (items) => {
        document.getElementById('floatingIcon').checked = items.floatingIcon;
    });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

// Gestion demande micro
const micBtn = document.getElementById('requestMic');
micBtn.addEventListener('click', () => {
    micBtn.textContent = 'Vérification...';

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
            micBtn.style.background = '#059669';
            micBtn.textContent = 'Autorisé ✅';
            // Arrêter le stream tout de suite, on voulait juste la permission
            stream.getTracks().forEach(track => track.stop());
        })
        .catch((err) => {
            console.error(err);
            micBtn.style.background = '#dc2626';
            micBtn.textContent = 'Refusé ❌';
            alert("L'accès au micro a été refusé. Veuillez vérifier les paramètres de votre navigateur pour cette extension.");
        });
});
