let darijaIcon = null;

document.addEventListener('mouseup', (e) => {
    // Petit délai pour laisser le temps à la sélection de se faire
    setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        console.log("[Darija Translator] Selection detected:", text.length, "chars");

        if (text.length > 0) {
            // Vérifier si l'option est activée (par défaut true)
            chrome.storage.sync.get({ floatingIcon: true }, (items) => {
                if (items.floatingIcon) {
                    showIcon(selection);
                }
            });
        } else {
            removeIcon();
        }
    }, 50);
});

// Enlever l'icône si on clique ailleurs sans sélectionner
document.addEventListener('mousedown', (e) => {
    if (darijaIcon && !darijaIcon.contains(e.target)) {
        removeIcon();
    }
});

function showIcon(selection) {
    if (darijaIcon) removeIcon();

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    darijaIcon = document.createElement('div');
    darijaIcon.style.cssText = `
        position: absolute;
        left: ${window.scrollX + rect.right}px;
        top: ${window.scrollY + rect.top - 30}px;
        background: #2563eb;
        color: white;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: bold;
        z-index: 2147483647;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 4px;
    `;

    // Icône svg simple
    darijaIcon.innerHTML = `
        <span style="font-size: 14px;">د</span>
        <span>Traduire</span>
    `;

    darijaIcon.onmousedown = (e) => {
        e.preventDefault(); // Empêche la désélection
        e.stopPropagation();
    };

    darijaIcon.onclick = () => {
        const text = selection.toString().trim();
        if (text) {
            chrome.runtime.sendMessage({
                action: "translate_selection",
                text: text
            });
            removeIcon();
        }
    };

    document.body.appendChild(darijaIcon);
}

function removeIcon() {
    if (darijaIcon) {
        darijaIcon.remove();
        darijaIcon = null;
    }
}
