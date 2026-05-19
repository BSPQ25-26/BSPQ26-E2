(function (scope) {
    const SESSION_KEY = "movieTrakk.session";
    const LEGACY_SESSION_KEY = "movieTracker.session";

    function readText(value) {
        return value === undefined || value === null ? "" : String(value).trim();
    }

    function toNumberOrZero(value) {
        const parsed = Number.parseInt(String(value), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function getSessionInfo(storage) {
        if (!storage) return null;
        try {
            const raw = storage.getItem(SESSION_KEY) || storage.getItem(LEGACY_SESSION_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch (_) {
            return null;
        }
    }

    async function requestJson(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Request failed");
        return response.json();
    }

    function setStat(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    }

    function movieYear(movie) {
        const year = toNumberOrZero(movie.year);
        return year > 0 ? String(year) : "N/A";
    }

    function createActivityRow(icon, movie, action) {
        const row = document.createElement("tr");

        const iconCell = document.createElement("td");
        const iconSpan = document.createElement("span");
        iconSpan.className = "material-symbols-outlined";
        iconSpan.setAttribute("aria-hidden", "true");
        iconSpan.textContent = icon;
        iconCell.append(iconSpan);

        const titleCell = document.createElement("td");
        titleCell.className = "table-title";
        const titleStrong = document.createElement("strong");
        titleStrong.textContent = readText(movie.title) || "Untitled";
        titleCell.append(titleStrong);

        const actionCell = document.createElement("td");
        actionCell.textContent = action;

        const genreCell = document.createElement("td");
        const genreChip = document.createElement("span");
        genreChip.className = "table-chip";
        genreChip.textContent = readText(movie.genre) || "Unknown";
        genreCell.append(genreChip);

        const yearCell = document.createElement("td");
        yearCell.textContent = movieYear(movie);

        row.append(iconCell, titleCell, actionCell, genreCell, yearCell);
        return row;
    }

    function createEmptyRow(text) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 5;
        cell.className = "table-empty";
        const strong = document.createElement("strong");
        strong.textContent = text;
        cell.append(strong);
        row.append(cell);
        return row;
    }

    function renderActivity(watched, liked, watchLater) {
        const body = document.getElementById("activity-body");
        if (!body) return;

        body.innerHTML = "";

        const rows = [];

        watched.slice(-5).reverse().forEach(function (movie) {
            rows.push(createActivityRow("play_circle", movie, "Watched"));
        });

        liked.slice(-3).reverse().forEach(function (movie) {
            rows.push(createActivityRow("favorite", movie, "Liked"));
        });

        watchLater.slice(-3).reverse().forEach(function (movie) {
            rows.push(createActivityRow("bookmark", movie, "Saved for later"));
        });

        if (rows.length === 0) {
            body.append(createEmptyRow("No activity yet. Start exploring movies!"));
            return;
        }

        rows.slice(0, 10).forEach(function (row) {
            body.append(row);
        });
    }

    function updateSessionUi(session) {
        var labels = document.querySelectorAll("#session-user, [data-session-user]");
        var text = session && session.username
            ? session.username + " (" + (session.role || "USER") + ")"
            : "Guest";

        labels.forEach(function (label) {
            label.textContent = text;
        });
    }

    function bindLogoutAction() {
        var buttons = document.querySelectorAll("[data-action='logout']");
        buttons.forEach(function (button) {
            if (button.dataset.logoutBound === "true") return;
            button.dataset.logoutBound = "true";
            button.addEventListener("click", function () {
                try {
                    if (scope.sessionStorage) {
                        scope.sessionStorage.removeItem(SESSION_KEY);
                        scope.sessionStorage.removeItem(LEGACY_SESSION_KEY);
                    }
                } catch (_) {}
                if (scope.window && scope.window.location) {
                    scope.window.location.assign("/index.html");
                }
            });
        });
    }

    async function loadDashboard() {
        var session = getSessionInfo(scope.sessionStorage);
        updateSessionUi(session);
        bindLogoutAction();

        var userId = session && session.userId ? session.userId : null;
        if (!userId) {
            document.getElementById("activity-body").innerHTML = "";
            var row = createEmptyRow("Please log in to see your dashboard");
            document.getElementById("activity-body").append(row);
            return;
        }

        try {
            var results = await Promise.all([
                requestJson("/api/users/" + userId + "/movies/watched"),
                requestJson("/api/users/" + userId + "/movies/liked"),
                requestJson("/api/users/" + userId + "/movies/watch-later/movies"),
                requestJson("/api/users/" + userId + "/movies/disliked")
            ]);

            var watched = results[0];
            var liked = results[1];
            var watchLater = results[2];
            var disliked = results[3];

            setStat("stat-watched", watched.length);
            setStat("stat-liked", liked.length);
            setStat("stat-watchlater", watchLater.length);
            setStat("stat-disliked", disliked.length);

            renderActivity(watched, liked, watchLater);
        } catch (error) {
            document.getElementById("activity-body").innerHTML = "";
            var errorRow = createEmptyRow("Could not load dashboard data");
            document.getElementById("activity-body").append(errorRow);
        }
    }

    function init() {
        loadDashboard();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})(typeof globalThis !== "undefined" ? globalThis : this);