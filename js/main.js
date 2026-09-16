// ShadowCon future scripts will go here
console.log("ShadowCon site loaded");

document.addEventListener("DOMContentLoaded", function () {

    // Detect if we are inside /pages
    const basePath = window.location.pathname.includes("/pages/")
        ? "../"
        : "";

    // Inject layout start
    const layoutStart = document.getElementById("layout-start");
    if (layoutStart) {
        fetch(basePath + "components/layout-start.html")
            .then(response => response.text())
            .then(html => {
                layoutStart.innerHTML = html;

                // Load logo
                const logoTarget = document.getElementById("logo-placeholder");
                if (logoTarget) {
                    fetch(basePath + "components/logo.html")
                        .then(r => r.text())
                        .then(h => logoTarget.innerHTML = h);
                }

                // Load navigation
                const navTarget = document.getElementById("nav-placeholder");
                if (navTarget) {
                    fetch(basePath + "components/nav.html")
                        .then(r => r.text())
                        .then(h => navTarget.innerHTML = h);
                }
            });
    }

    // Inject layout end
    const layoutEnd = document.getElementById("layout-end");
    if (layoutEnd) {
        fetch(basePath + "components/layout-end.html")
            .then(response => response.text())
            .then(html => {
                layoutEnd.innerHTML = html;
            });
    }
});
