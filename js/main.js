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
