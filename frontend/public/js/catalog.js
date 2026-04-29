(function () {
    const MOVIES_ENDPOINT = "/api/movies";
    const SESSION_KEY = "movieTrakk.session";
    const LEGACY_SESSION_KEY = "movieTracker.session";
    const USER_ID_STORAGE_KEY = "movieTrakk.userId";

    function readText(value) {
        return value === undefined || value === null ? "" : String(value).trim();
    }

    function toNumber(value) {
        const parsed = Number.parseInt(String(value), 10);
        return Number.isNaN(parsed) ? null : parsed;
    }

    function setMessage(text, isError) {
        const message = document.getElementById("catalog-message");
        if (!message) {
            return;
        }

        message.textContent = text || "";
        message.classList.remove("error", "success");
        if (text) {
            message.classList.add(isError ? "error" : "success");
        }
    }

    async function requestJson(url, options) {
        const response = await fetch(url, options);
        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message = typeof data === "string" ? data : (data.message || "Request failed");
            throw new Error(message || "Request failed");
        }

        return data;
    }

    function getSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY) || sessionStorage.getItem(LEGACY_SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function getUserId() {
        const session = getSession();
        if (session && session.userId) {
            return session.userId;
        }

        const saved = toNumber(localStorage.getItem(USER_ID_STORAGE_KEY));
        if (saved) {
            return saved;
        }

        return null;
    }

    function ensureUserId() {
        const existing = getUserId();
        if (existing) {
            return existing;
        }

        const raw = window.prompt("Introduce tu userId para guardar estados (watched/watch later/like/dislike):");
        const userId = toNumber(raw);
        if (!userId) {
            setMessage("No se pudo guardar el estado: falta userId.", true);
            return null;
        }

        localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
        return userId;
    }

    function createActionButton(label, action, active) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `status-btn ${active ? "active" : ""}`.trim();
        button.dataset.action = action;
        button.textContent = label;
        return button;
    }

    function createMovieCard(movie, status) {
        const card = document.createElement("article");
        card.className = "movie-card";
        card.dataset.movieId = String(movie.id);

        const title = document.createElement("h3");
        title.textContent = readText(movie.title) || "Untitled";

        const meta = document.createElement("div");
        meta.className = "meta";

        const genre = document.createElement("span");
        genre.className = "genre";
        genre.textContent = readText(movie.genre) || "Unknown";

        const year = document.createElement("span");
        year.className = "year";
        year.textContent = movie.year ? String(movie.year) : "N/A";

        const synopsis = document.createElement("p");
        synopsis.textContent = readText(movie.synopsis) || "No synopsis available.";

        const actions = document.createElement("div");
        actions.className = "status-actions";
        actions.append(
            createActionButton("Watched", "watched", Boolean(status.watched)),
            createActionButton("Watch Later", "watchLater", Boolean(status.watchLater)),
            createActionButton("Like", "liked", Boolean(status.liked)),
            createActionButton("Dislike", "disliked", Boolean(status.disliked))
        );

        meta.append(genre, year);
        card.append(title, meta, synopsis, actions);
        updateLikeDislikeAvailability(actions, status);
        return card;
    }

    function updateCardButtons(card, status) {
        const mapping = {
            watched: Boolean(status.watched),
            watchLater: Boolean(status.watchLater),
            liked: Boolean(status.liked),
            disliked: Boolean(status.disliked)
        };

        card.querySelectorAll(".status-btn").forEach((button) => {
            const active = mapping[button.dataset.action];
            button.classList.toggle("active", Boolean(active));
        });

        const actions = card.querySelector(".status-actions");
        if (actions) {
            updateLikeDislikeAvailability(actions, status);
        }
    }

    function updateLikeDislikeAvailability(actionsRoot, status) {
        const canRate = Boolean(status.watched);
        actionsRoot.querySelectorAll(".status-btn[data-action='liked'], .status-btn[data-action='disliked']")
            .forEach((button) => {
                button.disabled = !canRate;
                button.title = canRate ? "" : "You can only rate watched movies";
            });
    }

    function renderMovies(moviesWithStatus) {
        const grid = document.getElementById("catalog-grid");
        if (!grid) {
            return;
        }

        grid.innerHTML = "";
        if (!moviesWithStatus.length) {
            const empty = document.createElement("article");
            empty.className = "movie-card";
            empty.textContent = "No movies found.";
            grid.append(empty);
            return;
        }

        moviesWithStatus.forEach(({ movie, status }) => {
            grid.append(createMovieCard(movie, status));
        });
    }

    function buildMovieQuery() {
        const title = readText(document.getElementById("title")?.value);
        const genre = readText(document.getElementById("genre")?.value);
        const year = readText(document.getElementById("year")?.value);

        const params = new URLSearchParams();
        if (title) {
            params.set("query", title);
        }
        if (genre && genre.toLowerCase() !== "all") {
            params.set("genre", genre);
        }
        if (year) {
            params.set("year", year);
        }

        const query = params.toString();
        return query ? `?${query}` : "";
    }

    async function fetchStatusForMovie(userId, movieId) {
        if (!userId) {
            return { movieId, watchLater: false, watched: false, liked: false, disliked: false };
        }

        try {
            return await requestJson(`/api/users/${userId}/movies/${movieId}/status`);
        } catch (_) {
            return { movieId, watchLater: false, watched: false, liked: false, disliked: false };
        }
    }

    async function loadCatalog() {
        try {
            setMessage("", false);
            const movies = await requestJson(`${MOVIES_ENDPOINT}${buildMovieQuery()}`);
            const userId = getUserId();

            const moviesWithStatus = await Promise.all(
                (Array.isArray(movies) ? movies : []).map(async (movie) => ({
                    movie,
                    status: await fetchStatusForMovie(userId, movie.id)
                }))
            );

            renderMovies(moviesWithStatus);
        } catch (error) {
            setMessage(error.message || "Error loading catalog", true);
        }
    }

    async function applyStatusAction(userId, movieId, action, isActive) {
        if (action === "watched") {
            return requestJson(`/api/users/${userId}/movies/${movieId}/status/watched`, {
                method: "POST"
            });
        }

        if (action === "watchLater") {
            return requestJson(`/api/users/${userId}/movies/${movieId}/status/watch-later`, {
                method: isActive ? "DELETE" : "POST"
            });
        }

        if (action === "liked") {
            return requestJson(`/api/users/${userId}/movies/${movieId}/status/like`, {
                method: isActive ? "DELETE" : "POST"
            });
        }

        if (action === "disliked") {
            return requestJson(`/api/users/${userId}/movies/${movieId}/status/dislike`, {
                method: isActive ? "DELETE" : "POST"
            });
        }

        throw new Error("Unsupported action");
    }

    function bindFilters() {
        const title = document.getElementById("title");
        const genre = document.getElementById("genre");
        const year = document.getElementById("year");

        if (title) {
            title.addEventListener("input", debounce(loadCatalog, 300));
        }
        if (genre) {
            genre.addEventListener("change", loadCatalog);
        }
        if (year) {
            year.addEventListener("input", debounce(loadCatalog, 300));
        }
    }

    function bindStatusActions() {
        const grid = document.getElementById("catalog-grid");
        if (!grid) {
            return;
        }

        grid.addEventListener("click", async (event) => {
            const button = event.target.closest(".status-btn");
            if (!button) {
                return;
            }

            const card = event.target.closest(".movie-card");
            const movieId = toNumber(card?.dataset.movieId);
            const action = button.dataset.action;
            const isActive = button.classList.contains("active");

            if (!movieId || !action) {
                return;
            }

            const userId = ensureUserId();
            if (!userId) {
                return;
            }

            try {
                button.disabled = true;
                const status = await applyStatusAction(userId, movieId, action, isActive);
                updateCardButtons(card, status);
                setMessage("Status updated successfully", false);
            } catch (error) {
                setMessage(error.message || "Error updating movie status", true);
            } finally {
                button.disabled = false;
            }
        });
    }

    function debounce(fn, delay) {
        let timeoutId = null;
        return function debounced() {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                fn();
            }, delay);
        };
    }

    function init() {
        bindFilters();
        bindStatusActions();
        loadCatalog();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
