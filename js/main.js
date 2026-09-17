document.addEventListener("DOMContentLoaded", function () {

    // Always load from root-level components folder
    const basePath = "/components/";

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
                        .then(h => navTarget.innerHTML = h);
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
    
    // Mobile burger menu toggle
    const burger = document.getElementById("burger");
    const mobileMenu = document.getElementById("mobileMenu");

    if (burger && mobileMenu) {
        burger.addEventListener("click", () => {
            mobileMenu.classList.toggle("open");
        });
    }

});
