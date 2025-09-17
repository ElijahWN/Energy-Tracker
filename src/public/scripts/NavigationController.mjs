/**
 * Manages client-side navigation and view loading.
 * Handles routing to different pages like location list, edit, statistics, and leaderboard.
 */
export default class NavigationController {
    static {
        /**
         * Applies the stored theme or the system preferred theme on load.
         * @private
         */
        function applyInitialTheme() {
            const storedTheme = sessionStorage.getItem("theme");
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;
            const currentTheme = storedTheme
                ? storedTheme
                : prefersDark
                ? "dark"
                : "light";

            document.documentElement.setAttribute("data-theme", currentTheme);
            if (themeToggleInput) {
                 themeToggleInput.checked = currentTheme === "dark";
            }
             if (!storedTheme) {
                sessionStorage.setItem("theme", currentTheme);
            }
        }

        /**
         * Handles the theme toggle change event.
         * @param {Event} event - The change event object.
         * @private
         */
        function handleThemeToggle(event) {
            const isChecked = event.target.checked;
            const newTheme = isChecked ? "dark" : "light";
            document.documentElement.setAttribute("data-theme", newTheme);
            sessionStorage.setItem("theme", newTheme);
        }

        const header = document.createElement("header");
        header.classList.add("navigation");

        const burgerCheckbox = document.createElement("input");
        burgerCheckbox.type = "checkbox";
        burgerCheckbox.classList.add("mobile", "burger");

        const logoLink = document.createElement("a");
        logoLink.classList.add("link", "logo");
        logoLink.textContent = "Energy Tracker";
        logoLink.href = "/locations";

        const navElement = document.createElement("nav");
        navElement.classList.add("links");
        navElement.append(
            ...Object.entries({
                "My Locations": "/locations",
                Leaderboard: "/leaderboard",
                Statistics: "/statistics",
            }).map(([text, url]) => {
                const linkNode = document.createElement("a");
                linkNode.classList.add("link");
                linkNode.textContent = text;
                linkNode.href = url;
                return linkNode;
            })
        );

        const themeToggleInput = document.createElement("input");
        themeToggleInput.type = "checkbox";
        themeToggleInput.classList.add("theme", "toggle");
        themeToggleInput.addEventListener("change", handleThemeToggle);

        header.append(burgerCheckbox, logoLink, navElement, themeToggleInput);

        const mainSection = document.createElement("main");
        mainSection.append(...document.body.childNodes);
        document.body.innerHTML = "";

        document.body.append(header, mainSection);

        applyInitialTheme();
    }
}
