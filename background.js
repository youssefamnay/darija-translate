// URL de ton service REST
const API_URL = "http://localhost:3000/api/translate";

// Créer le menu contextuel lors de l'installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translate-darija",
        title: "Traduire \"%s\" en Darija",
        contexts: ["selection"]
    });
});

// Gérer le clic sur le menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate-darija" && info.selectionText) {
        handleTranslation(info.selectionText, tab.id);
    }
});

// Écouter les messages du content script (Bouton flottant)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "translate_selection" && request.text && sender.tab) {
        handleTranslation(request.text, sender.tab.id);
    }
});

async function handleTranslation(text, tabId) {
    try {
        // Injection script pour afficher "En cours..."
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: showLoadingPanel
        });

        // Appel API
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) throw new Error("Erreur API");

        const data = await response.json();
        const translation = data.translation || "Erreur de traduction";

        // Afficher le résultat
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: updatePanelContent,
            args: [text, translation]
        });

    } catch (error) {
        console.error("Erreur lors de la traduction:", error);
        // Essayer d'afficher l'erreur dans la page
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: updatePanelContent,
                args: [text, "Erreur: Impossible de traduire. Vérifiez que le serveur est lancé."]
            });
        } catch (injectionError) {
            console.warn("Impossible d'afficher l'erreur dans la page (onglet fermé ou restreint):", injectionError);
        }
    }
}

// --- Fonctions injectées (doivent être autonomes) ---

function showLoadingPanel() {
    let panel = document.getElementById('darija-translator-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'darija-translator-panel';
        panel.style.cssText = `
            position: fixed; top: 0; right: 0; width: 320px; height: 100vh;
            background: #111827; color: #f9fafb; z-index: 2147483647;
            box-shadow: -4px 0 16px rgba(0,0,0,0.35);
            font-family: system-ui, sans-serif; display: flex; flex-direction: column;
        `;
        document.body.appendChild(panel);
    }

    panel.innerHTML = `
        <div style="padding: 12px; border-bottom: 1px solid #374151; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600;">Darija Translator</span>
            <button id="darija-close" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:20px;">&times;</button>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af;">
            Traduction en cours...
        </div>
    `;

    document.getElementById('darija-close').onclick = () => panel.remove();
}

function updatePanelContent(source, translation) {
    const panel = document.getElementById('darija-translator-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div style="padding: 12px; border-bottom: 1px solid #374151; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600;">Darija Translator</span>
            <button id="darija-close" style="background:none; border:none; color:#9ca3af; cursor:pointer; font-size:20px;">&times;</button>
        </div>
        <div style="padding: 16px; overflow: auto; height: 100%;">
            <div style="font-size: 11px; color: #9ca3af; margin-bottom: 4px;">SOURCE</div>
            <div style="margin-bottom: 16px; padding: 8px; background: #1f2937; border-radius: 6px;">${source}</div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 4px;">
                <div style="font-size: 11px; color: #9ca3af;">TRADUCTION</div>
                <button id="darija-speak" style="background:none; border:none; color:#9ca3af; cursor:pointer; padding:2px;" title="Écouter">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                    </svg>
                </button>
            </div>
            <div style="padding: 8px; background: #2563eb; color: white; border-radius: 6px;">${translation}</div>
        </div>
    `;

    document.getElementById('darija-close').onclick = () => panel.remove();

    document.getElementById('darija-speak').onclick = () => {
        const utterance = new SpeechSynthesisUtterance(translation);
        utterance.lang = 'ar';
        window.speechSynthesis.speak(utterance);
    };
}
