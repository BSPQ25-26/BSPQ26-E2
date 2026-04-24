(function (scope) {
    const SESSION_KEY = "movieTrakk.session";
    const LEGACY_SESSION_KEY = "movieTracker.session";
    const USER_ID_STORAGE_KEY = "movieTrakk.userId";
    const LOGIN_PAGE_URL = "/index.html";
    const ADMIN_ROLE = "ADMIN";
    const ADMIN_DASHBOARD_URL = "/admin-dashboard.html";
    const LIST_ENDPOINTS = {
        watched: "watched",
<<<<<<< HEAD
        "watch-later": "watch-later",
        watchLater: "watch-later",
=======
        "watch-later": "watch-later/movies",
        watchLater: "watch-later/movies",
>>>>>>> origin/main
        liked: "liked",
        disliked: "disliked"
    };

    function readText(value) {
        return value === undefined || value === null ? "" : String(value).trim();
    }

    function toNumberOrZero(value) {
        const parsed = Number.parseInt(String(value), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function normalizeUserId(value) {
        const parsed = Number.parseInt(String(value), 10);
        return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
    }

    function getSessionInfo(storage = scope.sessionStorage) {
        if (!storage) {
            return null;
        }

        try {
            const raw = storage.getItem(SESSION_KEY) || storage.getItem(LEGACY_SESSION_KEY);
            if (!raw) {
                return null;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") {
                return null;
            }
            return parsed;
        } catch (_) {
            return null;
        }
    }

    function isAdminSession(session) {
        if (!session || typeof session.role !== "string") {
            return false;
        }
        return session.role.trim().toUpperCase() === ADMIN_ROLE;
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const contentType = response.headers && typeof response.headers.get === "function"
            ? (response.headers.get("content-type") || "")
            : "";
        let data = "";

        if (contentType.includes("application/json")) {
            try {
                data = await response.json();
            } catch (_) {
                data = "";
            }
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            const message = typeof data === "string" ? data : (data.message || "Request failed");
            throw new Error(message || "Request failed");
        }

        return data;
    }

    function movieDescription(movie) {
        const synopsis = readText(movie.synopsis);
        return synopsis || "No synopsis available.";
    }

    function movieYear(movie) {
        const year = toNumberOrZero(movie.year);
        return year > 0 ? String(year) : "N/A";
    }

    function movieDuration(movie) {
        const duration = toNumberOrZero(movie.duration);
        return duration > 0 ? `${duration}m` : "TBD";
    }

    function createPosterElement(movie) {
        const poster = document.createElement("div");
        poster.className = "movie-poster";

        const posterUrl = readText(movie.posterUrl);
        if (posterUrl) {
            const image = document.createElement("img");
            image.src = posterUrl;
            image.alt = `${readText(movie.title) || "Movie"} poster`;
            poster.append(image);
        } else {
            const fallback = document.createElement("div");
            fallback.className = "movie-poster-fallback";
            fallback.textContent = "No Poster";
            poster.append(fallback);
        }

        return poster;
    }

    function createMovieCard(movie) {
        const card = document.createElement("article");
        card.className = "movie-card";
        card.dataset.movieId = String(movie.id);

        const body = document.createElement("div");
        body.className = "movie-body";

        const title = document.createElement("h3");
        title.textContent = readText(movie.title) || "Untitled";

        const meta = document.createElement("div");
        meta.className = "meta";

        const genre = document.createElement("span");
        genre.className = "genre";
        genre.textContent = readText(movie.genre) || "Unknown";

        const year = document.createElement("span");
        year.className = "year";
        year.textContent = movieYear(movie);

        const duration = document.createElement("span");
        duration.className = "duration";
        duration.textContent = movieDuration(movie);

        const synopsis = document.createElement("p");
        synopsis.textContent = movieDescription(movie);

        meta.append(genre, year, duration);
        body.append(title, meta, synopsis);
        card.append(createPosterElement(movie), body);

        return card;
    }

    function renderMovies(gridElement, movies) {
        gridElement.innerHTML = "";

        if (!Array.isArray(movies) || movies.length === 0) {
            const empty = document.createElement("article");
            empty.className = "movie-card empty";
            empty.textContent = "No movies in this list.";
            gridElement.append(empty);
            return;
        }

        movies.forEach((movie) => {
            gridElement.append(createMovieCard(movie));
        });
    }

    function setStatus(element, message, error) {
        if (!element) {
            return;
        }

        element.textContent = message || "";
        element.classList.remove("error", "success");

        if (message) {
            element.classList.add(error ? "error" : "success");
        }
    }

    function updateSessionUi(session) {
        const labels = document.querySelectorAll("#session-user, [data-session-user]");
        const text = session && session.username
            ? `${session.username} (${session.role || "USER"})`
            : "Guest";

        labels.forEach((label) => {
            label.textContent = text;
        });
    }

    function bindLogoutAction() {
        const logoutButtons = document.querySelectorAll("[data-action='logout']");
        logoutButtons.forEach((button) => {
            if (button.dataset.logoutBound === "true") {
                return;
            }
            button.dataset.logoutBound = "true";
            button.addEventListener("click", () => {
                try {
                    if (scope.sessionStorage) {
                        scope.sessionStorage.removeItem(SESSION_KEY);
                        scope.sessionStorage.removeItem(LEGACY_SESSION_KEY);
                    }
                } catch (_) {}

                if (scope.window && scope.window.location) {
                    scope.window.location.assign(LOGIN_PAGE_URL);
                }
            });
        });
    }

    function toggleAdminLinks(adminMode) {
        const links = document.querySelectorAll("[data-admin-link]");
        links.forEach((link) => {
            link.hidden = !adminMode;
        });
    }

    function bindAdminDashboardAction() {
        const dashboardButton = document.getElementById("go-admin-dashboard");
        if (!dashboardButton) {
            return;
        }
        if (dashboardButton.dataset.dashboardBound === "true") {
            return;
        }
        dashboardButton.dataset.dashboardBound = "true";
        dashboardButton.addEventListener("click", () => {
            if (scope.window && scope.window.location) {
                scope.window.location.assign(ADMIN_DASHBOARD_URL);
            }
        });
    }

    function persistSession(session) {
        if (!scope.sessionStorage || !session) {
            return;
        }

        const normalizedUserId = normalizeUserId(session.userId);
        const sessionToStore = {
            ...session,
            userId: normalizedUserId
        };

        try {
            scope.sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionToStore));
            scope.sessionStorage.removeItem(LEGACY_SESSION_KEY);
            if (normalizedUserId) {
                scope.localStorage?.setItem(USER_ID_STORAGE_KEY, String(normalizedUserId));
            }
        } catch (_) {}
    }

    function getStoredUserId() {
        try {
            const saved = scope.localStorage?.getItem(USER_ID_STORAGE_KEY);
            if (!saved) {
                return null;
            }
            return normalizeUserId(saved);
        } catch (_) {
            return null;
        }
    }

    async function ensureSessionUserId(session) {
        if (!session) {
            const storedUserId = getStoredUserId();
            if (!storedUserId) {
                return null;
            }

            const recoveredSession = {
                userId: storedUserId,
                username: "",
                role: "USER"
            };
            persistSession(recoveredSession);
            return recoveredSession;
        }

        const currentUserId = normalizeUserId(session.userId);
        if (currentUserId) {
            if (session.userId !== currentUserId) {
                const normalizedSession = {
                    ...session,
                    userId: currentUserId
                };
                persistSession(normalizedSession);
                return normalizedSession;
            }
            return session;
        }

        const storedUserId = getStoredUserId();
        if (storedUserId) {
            const updatedFromStorage = {
                ...session,
                userId: storedUserId
            };
            persistSession(updatedFromStorage);
            return updatedFromStorage;
        }

        const username = readText(session.username);
        if (!username) {
            return session;
        }

        try {
            const resolved = await requestJson(`/api/auth/resolve-user?username=${encodeURIComponent(username)}`);
            if (resolved && resolved.userId) {
                const updatedSession = {
                    ...session,
                    userId: resolved.userId,
                    role: resolved.role || session.role || "USER",
                    username: resolved.username || session.username
                };
                persistSession(updatedSession);
                return updatedSession;
            }
        } catch (_) {}

        return session;
    }

<<<<<<< HEAD
    function showLoading(show = true) {
=======
    function showLoading(show) {
>>>>>>> origin/main
        const loading = document.getElementById("loading");
        if (loading) {
            loading.style.display = show ? "block" : "none";
        }
    }

    async function loadMovieList(userId, listType) {
        try {
            showLoading(true);
            const normalizedListType = LIST_ENDPOINTS[listType] || "watched";
            const normalizedUserId = normalizeUserId(userId);
            if (!normalizedUserId) {
                throw new Error("Invalid user session. Please log in again.");
            }
            const endpoint = `/api/users/${normalizedUserId}/movies/${normalizedListType}`;
            const data = await requestJson(endpoint);
            return Array.isArray(data) ? data : [];
        } catch (error) {
<<<<<<< HEAD
            console.error(`Error loading ${listType} list:`, error);
            setStatus(document.getElementById("status-message"), `Error loading ${listType} list: ${error?.message || "Unknown error"}`, true);
=======
            setStatus(
                document.getElementById("status-message"),
                `Error loading ${listType} list: ${error?.message || "Unknown error"}`,
                true
            );
>>>>>>> origin/main
            return [];
        } finally {
            showLoading(false);
        }
    }

    function bindTabButtons() {
        const tabButtons = document.querySelectorAll(".tab-button");
        tabButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const listType = button.dataset.listType;
<<<<<<< HEAD
                if (!listType) return;

                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");

                // Load and display the list
=======
                if (!listType) {
                    return;
                }

                tabButtons.forEach((tabButton) => tabButton.classList.remove("active"));
                button.classList.add("active");
>>>>>>> origin/main
                loadAndDisplayList(listType);
            });
        });
    }

    async function loadAndDisplayList(listType) {
        const session = await ensureSessionUserId(getSessionInfo());
        if (!session || !session.userId) {
            setStatus(document.getElementById("status-message"), "Your session is outdated. Please log in again.", true);
            return;
        }

        const movies = await loadMovieList(session.userId, listType);
<<<<<<< HEAD
        const grid = document.getElementById("catalog-grid") || document.getElementById("movies-grid");
=======
        const grid = document.getElementById("catalog-grid");
>>>>>>> origin/main
        if (!grid) {
            setStatus(document.getElementById("status-message"), "Movies area not found in page.", true);
            return;
        }
        renderMovies(grid, movies);
    }

    async function initPage() {
        const session = await ensureSessionUserId(getSessionInfo());
        if (!session || !session.userId) {
            setStatus(document.getElementById("status-message"), "Your session is outdated. Please log in again.", true);
            return;
        }

        updateSessionUi(session);
        bindLogoutAction();
        bindAdminDashboardAction();
        toggleAdminLinks(isAdminSession(session));
        bindTabButtons();
        await loadAndDisplayList("watched");
    }

    if (scope.document && scope.document.readyState === "loading") {
        scope.document.addEventListener("DOMContentLoaded", initPage);
    } else {
        initPage();
    }
<<<<<<< HEAD

=======
>>>>>>> origin/main
})(window);
