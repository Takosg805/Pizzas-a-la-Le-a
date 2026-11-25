(function () {
    const toggle = document.getElementById("menu-toggle");
    const menu = document.getElementById("side-menu");
    const close = document.getElementById("menu-close");
    const overlay = document.getElementById("menu-overlay");

    if (!toggle || !menu || !close || !overlay) return;

    function openMenu() {
        menu.classList.add("open");
        overlay.classList.add("open");
        menu.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("menu-open");
        close.focus();
    }

    function closeMenu() {
        menu.classList.remove("open");
        overlay.classList.remove("open");
        menu.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
        toggle.focus();
    }

    toggle.addEventListener("click", openMenu);
    close.addEventListener("click", closeMenu);
    overlay.addEventListener("click", closeMenu);

    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && menu.classList.contains("open")) {
            closeMenu();
        }
    });
})();
