//------------------------------------------------------------
// ShadowCon Admin Modal System
//------------------------------------------------------------

// Create and show a modal with the given HTML content
export function openModal(html) {
    // Backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "admin-modal-backdrop";

    // Modal window
    const modal = document.createElement("div");
    modal.className = "admin-modal";
    modal.innerHTML = html;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Close when clicking outside modal
    backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
            closeModal();
        }
    });
}

// Remove the modal from the DOM
export function closeModal() {
    const backdrop = document.querySelector(".admin-modal-backdrop");
    if (backdrop) backdrop.remove();
}
