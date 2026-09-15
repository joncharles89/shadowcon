// ShadowCon future scripts will go here
console.log("ShadowCon site loaded");

document.addEventListener("DOMContentLoaded", function () {
    const navTarget = document.getElementById("nav-placeholder");

    if (navTarget) {
        fetch("components/nav.html")
            .then(response => response.text())
            .then(html => {
                navTarget.innerHTML = html;
            })
            .catch(err => {
                console.error("Navigation failed to load:", err);
            });
    }
});
