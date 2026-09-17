document.addEventListener("DOMContentLoaded", function () {

    // Always load from root-level components folder
    const basePath = "/components/";

    function initMobileNav() {
        const burger = document.getElementById("burger");
        const mobileMenu = document.getElementById("mobileMenu");

        if (!burger || !mobileMenu) return;

        burger.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("open");
            burger.setAttribute("aria-expanded", String(isOpen));
        });

        mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("open");
                burger.setAttribute("aria-expanded", "false");
            });
        });

        // Expandable mobile submenu
        const expandToggles = document.querySelectorAll(".expand-toggle");

        expandToggles.forEach(toggle => {
            toggle.addEventListener("click", () => {
                const submenu = toggle.nextElementSibling;
                const isOpen = submenu.classList.toggle("open");
                toggle.classList.toggle("open");
            });
        });

        document.querySelectorAll(".mobile-submenu a").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("open");
                burger.setAttribute("aria-expanded", "false");
            });
        });

    }

    initMobileNav();

    // Inject layout start
    const layoutStart = document.getElementById("layout-start");
    if (layoutStart) {
        fetch(basePath + "layout-start.html")
            .then(response => response.text())
            .then(html => {
                layoutStart.innerHTML = html;

                // Load logo
                const logoTarget = document.getElementById("logo-placeholder");
                if (logoTarget) {
                    fetch(basePath + "logo.html")
                        .then(r => r.text())
                        .then(h => logoTarget.innerHTML = h);
                }

                // Load navigation
                const navTarget = document.getElementById("nav-placeholder");
                if (navTarget) {
                    fetch(basePath + "nav.html")
                        .then(r => r.text())
                        .then(h => {
                            navTarget.innerHTML = h;
                            initMobileNav();
                        });
                }
            });
    }

    // Inject layout end
    const layoutEnd = document.getElementById("layout-end");
    if (layoutEnd) {
        fetch(basePath + "layout-end.html")
            .then(response => response.text())
            .then(html => {
                layoutEnd.innerHTML = html;
            });
    }

});

// Gallery modal functionality
document.addEventListener("click", function(e) {
    if (e.target.matches(".gallery img")) {

        const src = e.target.getAttribute("src");
        const caption = e.target.getAttribute("data-caption") || "";

        const modal = document.createElement("div");
        modal.className = "gallery-modal";
        modal.innerHTML = `
            <div class="gallery-modal-inner">
                <img src="${src}">
                <p class="gallery-caption">${caption}</p>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener("click", () => modal.remove());
    }
});
// Close modal on Escape key
document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
        const modal = document.querySelector(".gallery-modal");
        if (modal) modal.remove();
    }
});

// Highlight active menu link based on scroll position
const sections = document.querySelectorAll(".content h1[id], .content h2[id]");
const menuLinks = document.querySelectorAll(".mobile-submenu a");

function activateMenuLink(id) {
    menuLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
}

function onScroll() {
    let current = "";

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
            current = section.id;
        }
    });

    if (current) {
        activateMenuLink(current);
    }
}

// Throttle scroll event for performance
let ticking = false;

document.addEventListener("scroll", () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            onScroll();
            ticking = false;
        });
        ticking = true;
    }
});

// Highlight active menu link on click
menuLinks.forEach(link => {
    link.addEventListener("click", () => {
        menuLinks.forEach(l => l.classList.remove("active"));
        link.classList.add("active");
    });
});

