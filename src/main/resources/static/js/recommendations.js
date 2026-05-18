(function () {
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
        if (!message) return;

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
        if (session && session.userId) return session.userId;
        
        const saved = toNumber(localStorage.getItem(USER_ID_STORAGE_KEY));
        if (saved) return saved;
        
        return null;
    }

    function ensureUserId() {
        const existing = getUserId();
        if (existing) return existing;

        const raw = window.prompt("Enter your user ID for personalized recommendations:");
        const userId = toNumber(raw);
        if (!userId) {
            setMessage("User ID required for personalized recommendations.", true);
            return null;
        }

        localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
        return userId;
    }

    function createMovieCard(movie) {
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

        meta.append(genre, year);
        card.append(title, meta, synopsis);
        return card;
    }

    function renderRecommendations(movies) {
        const grid = document.getElementById("catalog-grid");
        if (!grid) return;

        grid.innerHTML = "";
        
        if (!movies.length) {
            const empty = document.createElement("article");
            empty.className = "movie-card";
            empty.style.gridColumn = "1 / -1";
            empty.style.textAlign = "center";
            empty.style.padding = "3rem";
            empty.innerHTML = `
                <h3>No recommendations yet</h3>
                <p>Start watching and rating movies to get personalized recommendations!</p>
                <a href="/catalog.html" class="secondary-button" style="margin-top: 1rem;">Browse Movies</a>
            `;
            grid.append(empty);
            return;
        }

        movies.forEach(movie => grid.append(createMovieCard(movie)));
    }

    async function loadRecommendations() {
        try {
            setMessage("Loading recommendations...", false);
            
            const userId = getUserId();
            let recommendations;
            
            if (userId) {
                try {
                    recommendations = await requestJson(`/api/users/${userId}/recommendations?limit=10`);
                    setMessage("Personalized recommendations based on your taste", false);
                } catch (error) {
                    console.warn("Personalized recommendations failed:", error);
                    setMessage("Showing popular recommendations instead", false);
                    recommendations = await requestJson("/api/recommendations?limit=10");
                }
            } else {
                recommendations = await requestJson("/api/recommendations?limit=10");
                setMessage("Popular movies you might enjoy", false);
            }

            renderRecommendations(Array.isArray(recommendations) ? recommendations : []);
        } catch (error) {
            setMessage("Couldn't load recommendations. Try browsing the catalog instead.", true);
            renderRecommendations([]);
        }
    }

    function init() {
        loadRecommendations();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();