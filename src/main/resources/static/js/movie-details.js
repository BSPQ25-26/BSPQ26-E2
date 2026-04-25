(function (scope) {
    const SESSION_KEY = "movieTrakk.session";
    const LEGACY_SESSION_KEY = "movieTracker.session";
    
    // Elements
    const movieContent = document.getElementById("movie-content");
    const loadingState = document.getElementById("loading-state");
    const errorState = document.getElementById("error-state");
    const errorMessage = document.getElementById("error-message");
    const toastContainer = document.getElementById("toast-container");
    
    const ui = {
        backdrop: document.getElementById("movie-backdrop"),
        poster: document.getElementById("movie-poster"),
        title: document.getElementById("movie-title"),
        genre: document.getElementById("movie-genre"),
        year: document.getElementById("movie-year"),
        duration: document.getElementById("movie-duration"),
        synopsis: document.getElementById("movie-synopsis"),
        actionsBar: document.getElementById("user-actions-bar"),
        noteSection: document.getElementById("note-section-container"),
        userNote: document.getElementById("user-note"),
        btnSaveNote: document.getElementById("btn-save-note"),
        sessionUser: document.getElementById("session-user"),
        btnLogout: document.getElementById("btn-logout"),
        buttons: {
            "watch-later": document.getElementById("btn-watch-later"),
            "watched": document.getElementById("btn-watched"),
            "like": document.getElementById("btn-like"),
            "dislike": document.getElementById("btn-dislike")
        }
    };

    let session = getSessionInfo();
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    function getSessionInfo() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY) || sessionStorage.getItem(LEGACY_SESSION_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (_) {
            return null;
        }
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async function fetchMovieDetails() {
        if (!movieId) {
            showError("No movie ID specified.");
            return;
        }

        try {
            const response = await fetch(`/api/movies/${movieId}`);
            if (!response.ok) {
                if (response.status === 404) throw new Error("Movie not found.");
                throw new Error("Failed to load movie details.");
            }
            const movie = await response.json();
            renderMovie(movie);
            
            if (session && session.userId) {
                ui.actionsBar.style.display = "flex";
                ui.noteSection.style.display = "block";
                ui.sessionUser.textContent = `${session.username} (${session.role || 'USER'})`;
                await fetchUserStatus();
            }
        } catch (error) {
            showError(error.message);
        }
    }

    function renderMovie(movie) {
        ui.title.textContent = movie.title || "Untitled";
        ui.genre.textContent = movie.genre || "Unknown Genre";
        ui.year.textContent = movie.year || "N/A";
        ui.duration.textContent = movie.duration ? `${movie.duration} min` : "TBD";
        ui.synopsis.textContent = movie.synopsis || "No synopsis available.";
        
        const posterUrl = movie.posterUrl || "";
        ui.poster.src = posterUrl;
        ui.backdrop.src = posterUrl;
        
        loadingState.style.display = "none";
        movieContent.style.display = "block";
    }

    async function fetchUserStatus() {
        try {
            const response = await fetch(`/api/users/${session.userId}/movies/${movieId}/status`);
            if (response.ok) {
                const status = await response.json();
                updateStatusButtons(status);
                if (status.note) {
                    ui.userNote.value = status.note;
                }
            }
        } catch (e) {
            console.error("Failed to load user status", e);
        }
    }

    function updateStatusButtons(status) {
        ui.buttons["watch-later"].classList.toggle("active", status.watchLater);
        ui.buttons["watched"].classList.toggle("active", status.watched);
        ui.buttons["like"].classList.toggle("active", status.liked);
        ui.buttons["dislike"].classList.toggle("active", status.disliked);
    }

    async function toggleStatus(type) {
        if (!session) return;
        
        const btn = ui.buttons[type];
        const isActive = btn.classList.contains("active");
        const method = isActive ? "DELETE" : "POST";
        
        // Disable temporarily
        btn.style.pointerEvents = "none";
        
        try {
            const response = await fetch(`/api/users/${session.userId}/movies/${movieId}/status/${type}`, {
                method: method,
                headers: { "Content-Type": "application/json" }
            });
            
            if (response.ok) {
                const newStatus = await response.json();
                updateStatusButtons(newStatus);
                showToast(`Status updated successfully`);
            } else {
                showToast(`Failed to update status`, "error");
            }
        } catch (e) {
            showToast(`Error: ${e.message}`, "error");
        } finally {
            btn.style.pointerEvents = "auto";
        }
    }

    async function saveNote() {
        if (!session) return;
        
        const note = ui.userNote.value.trim();
        const method = note ? "PUT" : "DELETE";
        
        ui.btnSaveNote.disabled = true;
        ui.btnSaveNote.textContent = "Saving...";
        
        try {
            const response = await fetch(`/api/users/${session.userId}/movies/${movieId}/status/note`, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: note ? JSON.stringify({ note }) : null
            });
            
            if (response.ok) {
                showToast("Note saved successfully");
            } else {
                showToast("Failed to save note", "error");
            }
        } catch (e) {
            showToast(`Error: ${e.message}`, "error");
        } finally {
            ui.btnSaveNote.disabled = false;
            ui.btnSaveNote.textContent = "Save Notes";
        }
    }

    function showError(msg) {
        loadingState.style.display = "none";
        movieContent.style.display = "none";
        errorState.style.display = "block";
        errorMessage.textContent = msg;
    }

    // Event Listeners
    Object.keys(ui.buttons).forEach(type => {
        ui.buttons[type].addEventListener("click", () => toggleStatus(type));
    });

    ui.btnSaveNote.addEventListener("click", saveNote);

    ui.btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
        window.location.href = "/index.html";
    });

    // Init
    fetchMovieDetails();

})(window);
