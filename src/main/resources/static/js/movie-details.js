(function (scope) {
    const SESSION_KEY = "movieTrakk.session";
    const LEGACY_SESSION_KEY = "movieTracker.session";
    const LOGIN_PAGE_URL = "/index.html";
    const STATUS_FIELDS = {
        "watch-later": "watchLater",
        watched: "watched",
        like: "liked",
        dislike: "disliked"
    };

    function getSessionInfo(storage = scope.sessionStorage) {
        try {
            const raw = storage?.getItem(SESSION_KEY) || storage?.getItem(LEGACY_SESSION_KEY);
            if (!raw) {
                return null;
            }
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    }

    function getMovieId(location = scope.location) {
        const search = location && typeof location.search === "string" ? location.search : "";
        return new URLSearchParams(search).get("id");
    }

    function createUi(doc = scope.document) {
        return {
            movieContent: doc?.getElementById("movie-content"),
            loadingState: doc?.getElementById("loading-state"),
            errorState: doc?.getElementById("error-state"),
            errorMessage: doc?.getElementById("error-message"),
            toastContainer: doc?.getElementById("toast-container"),
            backdrop: doc?.getElementById("movie-backdrop"),
            poster: doc?.getElementById("movie-poster"),
            title: doc?.getElementById("movie-title"),
            genre: doc?.getElementById("movie-genre"),
            year: doc?.getElementById("movie-year"),
            duration: doc?.getElementById("movie-duration"),
            synopsis: doc?.getElementById("movie-synopsis"),
            actionsBar: doc?.getElementById("user-actions-bar"),
            noteSection: doc?.getElementById("note-section-container"),
            userNote: doc?.getElementById("user-note"),
            btnSaveNote: doc?.getElementById("btn-save-note"),
            sessionUser: doc?.getElementById("session-user"),
            btnLogout: doc?.getElementById("btn-logout"),
            buttons: {
                "watch-later": doc?.getElementById("btn-watch-later"),
                watched: doc?.getElementById("btn-watched"),
                like: doc?.getElementById("btn-like"),
                dislike: doc?.getElementById("btn-dislike")
            }
        };
    }

    function setText(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    function setDisplay(element, value) {
        if (element) {
            element.style.display = value;
        }
    }

    function setImageSource(element, value) {
        if (element) {
            element.src = value;
        }
    }

    function setSessionUser(ui, session) {
        setText(ui.sessionUser, session && session.username
            ? `${session.username} (${session.role || "USER"})`
            : "Guest");
    }

    function showToast(container, message, type = "success", setTimeoutFn = scope.setTimeout) {
        if (!container) {
            return;
        }

        const toast = container.ownerDocument.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeoutFn(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(100%)";
            toast.style.transition = "all 0.3s ease";
            setTimeoutFn(() => toast.remove(), 300);
        }, 3000);
    }

    function renderMovie(ui, movie) {
        setText(ui.title, movie.title || "Untitled");
        setText(ui.genre, movie.genre || "Unknown Genre");
        setText(ui.year, movie.year || "N/A");
        setText(ui.duration, movie.duration ? `${movie.duration} min` : "TBD");
        setText(ui.synopsis, movie.synopsis || "No synopsis available.");

        const posterUrl = movie.posterUrl || "";
        setImageSource(ui.poster, posterUrl);
        setImageSource(ui.backdrop, posterUrl);
        setDisplay(ui.loadingState, "none");
        setDisplay(ui.errorState, "none");
        setDisplay(ui.movieContent, "block");
    }

    function updateStatusButtons(ui, status) {
        Object.keys(STATUS_FIELDS).forEach((type) => {
            const button = ui.buttons[type];
            if (button) {
                button.classList.toggle("active", Boolean(status[STATUS_FIELDS[type]]));
            }
        });
    }

    function showError(ui, message) {
        setDisplay(ui.loadingState, "none");
        setDisplay(ui.movieContent, "none");
        setDisplay(ui.errorState, "block");
        setText(ui.errorMessage, message);
    }

    async function fetchUserStatus(fetchImpl, session, movieId, ui) {
        try {
            const response = await fetchImpl(`/api/users/${session.userId}/movies/${movieId}/status`);
            if (!response.ok) {
                return null;
            }

            const status = await response.json();
            updateStatusButtons(ui, status);
            if (status.note && ui.userNote) {
                ui.userNote.value = status.note;
            }
            return status;
        } catch (_) {
            return null;
        }
    }

    async function fetchMovieDetails(fetchImpl, session, movieId, ui) {
        if (!movieId) {
            showError(ui, "No movie ID specified.");
            return null;
        }

        try {
            const response = await fetchImpl(`/api/movies/${movieId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Movie not found.");
                }
                throw new Error("Failed to load movie details.");
            }

            const movie = await response.json();
            renderMovie(ui, movie);

            if (session && session.userId) {
                setDisplay(ui.actionsBar, "flex");
                setDisplay(ui.noteSection, "block");
                setSessionUser(ui, session);
                await fetchUserStatus(fetchImpl, session, movieId, ui);
            }

            return movie;
        } catch (error) {
            showError(ui, error.message);
            return null;
        }
    }

    async function toggleStatus(type, fetchImpl, session, movieId, ui) {
        if (!session || !session.userId) {
            return false;
        }

        const button = ui.buttons[type];
        if (!button) {
            return false;
        }

        const isActive = button.classList.contains("active");
        const method = isActive ? "DELETE" : "POST";

        button.style.pointerEvents = "none";

        try {
            const response = await fetchImpl(`/api/users/${session.userId}/movies/${movieId}/status/${type}`, {
                method,
                headers: { "Content-Type": "application/json" }
            });

            if (response.ok) {
                const newStatus = await response.json();
                updateStatusButtons(ui, newStatus);
                showToast(ui.toastContainer, "Status updated successfully");
                return true;
            }

            showToast(ui.toastContainer, "Failed to update status", "error");
            return false;
        } catch (error) {
            showToast(ui.toastContainer, `Error: ${error.message}`, "error");
            return false;
        } finally {
            button.style.pointerEvents = "auto";
        }
    }

    async function saveNote(fetchImpl, session, movieId, ui) {
        if (!session || !session.userId || !ui.userNote || !ui.btnSaveNote) {
            return false;
        }

        const note = ui.userNote.value.trim();
        const method = note ? "PUT" : "DELETE";

        ui.btnSaveNote.disabled = true;
        ui.btnSaveNote.textContent = "Saving...";

        try {
            const response = await fetchImpl(`/api/users/${session.userId}/movies/${movieId}/status/note`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: note ? JSON.stringify({ note }) : null
            });

            if (response.ok) {
                showToast(ui.toastContainer, "Note saved successfully");
                return true;
            }

            showToast(ui.toastContainer, "Failed to save note", "error");
            return false;
        } catch (error) {
            showToast(ui.toastContainer, `Error: ${error.message}`, "error");
            return false;
        } finally {
            ui.btnSaveNote.disabled = false;
            ui.btnSaveNote.textContent = "Save Notes";
        }
    }

    function bindActionButtons(fetchImpl, session, movieId, ui) {
        Object.keys(ui.buttons).forEach((type) => {
            const button = ui.buttons[type];
            if (!button || button.dataset.detailsBound === "true") {
                return;
            }

            button.dataset.detailsBound = "true";
            button.addEventListener("click", () => toggleStatus(type, fetchImpl, session, movieId, ui));
        });

        if (ui.btnSaveNote && ui.btnSaveNote.dataset.detailsBound !== "true") {
            ui.btnSaveNote.dataset.detailsBound = "true";
            ui.btnSaveNote.addEventListener("click", () => saveNote(fetchImpl, session, movieId, ui));
        }

        if (ui.btnLogout && ui.btnLogout.dataset.detailsBound !== "true") {
            ui.btnLogout.dataset.detailsBound = "true";
            ui.btnLogout.addEventListener("click", () => {
                scope.sessionStorage?.removeItem(SESSION_KEY);
                scope.sessionStorage?.removeItem(LEGACY_SESSION_KEY);
                scope.window?.location?.assign(LOGIN_PAGE_URL);
            });
        }
    }

    async function initMovieDetailsPage(
        doc = scope.document,
        location = scope.location,
        fetchImpl = scope.fetch
    ) {
        const ui = createUi(doc);
        const session = getSessionInfo();
        const movieId = getMovieId(location);

        setSessionUser(ui, session);
        bindActionButtons(fetchImpl, session, movieId, ui);
        await fetchMovieDetails(fetchImpl, session, movieId, ui);

        return { session, movieId, ui };
    }

    const exportsObject = {
        STATUS_FIELDS,
        getSessionInfo,
        getMovieId,
        createUi,
        setSessionUser,
        showToast,
        renderMovie,
        updateStatusButtons,
        showError,
        fetchUserStatus,
        fetchMovieDetails,
        toggleStatus,
        saveNote,
        initMovieDetailsPage
    };

    /* istanbul ignore next */
    if (typeof module !== "undefined" && module.exports) {
        module.exports = exportsObject;
    }

    /* istanbul ignore next */
    if (scope && typeof scope.window !== "undefined") {
        scope.window.MovieDetails = exportsObject;
        /* istanbul ignore next */
        if (!scope.window.__MOVIE_DETAILS_DISABLE_AUTO_INIT__) {
            /* istanbul ignore next */
            if (scope.document.readyState === "loading") {
                scope.document.addEventListener("DOMContentLoaded", () => initMovieDetailsPage());
            } else {
                initMovieDetailsPage();
            }
        }
    }
})(typeof globalThis !== "undefined" ? globalThis : this);
