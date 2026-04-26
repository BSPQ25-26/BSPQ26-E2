(function (scope) {
    const MOVIES_ENDPOINT = "/api/movies";
    const SESSION_KEY = "movieTrakk.session";
    const LEGACY_SESSION_KEY = "movieTracker.session";
    const USER_ID_STORAGE_KEY = "movieTrakk.userId";
    const ADMIN_ROLE = "ADMIN";
    const LOGIN_PAGE_URL = "/index.html";
    const ADMIN_DASHBOARD_URL = "/admin-dashboard.html";
    const ADMIN_PAGE_SIZE = 8;
    const DEFAULT_GENRES = [
        "Action",
        "Adventure",
        "Comedy",
        "Drama",
        "Fantasy",
        "Horror",
        "Noir",
        "Sci-Fi",
        "Thriller"
    ];

    function readText(value) {
        return value === undefined || value === null ? "" : String(value).trim();
    }

    function toNumberOrZero(value) {
        const parsed = Number.parseInt(String(value), 10);
        return Number.isNaN(parsed) ? 0 : parsed;
    }

    function compareText(left, right) {
        return readText(left).localeCompare(readText(right), undefined, { sensitivity: "base" });
    }

    function buildMovieQuery(filters) {
        const params = new URLSearchParams();
        const title = readText(filters?.title);
        const genre = readText(filters?.genre);
        const year = readText(filters?.year);

        if (title) {
            params.set("query", title);
        }
        if (genre && genre.toLowerCase() !== "all") {
            params.set("genre", genre);
        }
        if (year) {
            params.set("year", year);
        }

        const queryString = params.toString();
        return queryString ? `?${queryString}` : "";
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

    function normalizeUserId(value) {
        const parsed = Number.parseInt(String(value), 10);
        return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
    }

    function getStoredUserId() {
        try {
            return normalizeUserId(scope.localStorage?.getItem(USER_ID_STORAGE_KEY));
        } catch (_) {
            return null;
        }
    }

    function getUserId() {
        const session = getSessionInfo();
        const sessionUserId = normalizeUserId(session?.userId);
        return sessionUserId || getStoredUserId();
    }

    function ensureUserId() {
        const existing = getUserId();
        if (existing) {
            return existing;
        }

        const raw = scope.window?.prompt("Introduce tu userId para guardar el estado de la película:");
        const userId = normalizeUserId(raw);
        if (!userId) {
            return null;
        }

        try {
            scope.localStorage?.setItem(USER_ID_STORAGE_KEY, String(userId));
        } catch (_) {}

        return userId;
    }

    function createEmptyStatus(movieId) {
        return {
            movieId,
            watchLater: false,
            watched: false,
            liked: false,
            disliked: false
        };
    }

    async function fetchStatusForMovie(userId, movieId) {
        if (!userId) {
            return createEmptyStatus(movieId);
        }

        try {
            const status = await requestJson(`/api/users/${userId}/movies/${movieId}/status`);
            return status && typeof status === "object" ? status : createEmptyStatus(movieId);
        } catch (_) {
            return createEmptyStatus(movieId);
        }
    }

    function createStatusButton(label, action, active) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `status-action-button${active ? " active" : ""}`;
        button.dataset.action = action;
        button.textContent = label;
        return button;
    }

    function updateStatusButtonAvailability(actionsRoot, status) {
        const canRate = Boolean(status && status.watched);
        actionsRoot.querySelectorAll(".status-action-button[data-action='liked'], .status-action-button[data-action='disliked']")
            .forEach((button) => {
                button.disabled = !canRate;
                button.title = canRate ? "" : "You can only rate watched movies";
            });
    }

    function createStatusActions(status) {
        const actions = document.createElement("div");
        actions.className = "status-actions";
        actions.append(
            createStatusButton("Watched", "watched", Boolean(status.watched)),
            createStatusButton("Watch Later", "watchLater", Boolean(status.watchLater)),
            createStatusButton("Like", "liked", Boolean(status.liked)),
            createStatusButton("Dislike", "disliked", Boolean(status.disliked))
        );
        updateStatusButtonAvailability(actions, status);
        return actions;
    }

    function updateStatusButtons(card, status) {
        const mapping = {
            watched: Boolean(status.watched),
            watchLater: Boolean(status.watchLater),
            liked: Boolean(status.liked),
            disliked: Boolean(status.disliked)
        };

        card.querySelectorAll(".status-action-button").forEach((button) => {
            const active = Boolean(mapping[button.dataset.action]);
            button.classList.toggle("active", active);
        });

        const actions = card.querySelector(".status-actions");
        if (actions) {
            updateStatusButtonAvailability(actions, status);
        }
    }

    async function applyStatusAction(userId, movieId, action, isActive) {
        if (action === "watched") {
            return requestJson(`/api/users/${userId}/movies/${movieId}/status/watched`, {
                method: isActive ? "DELETE" : "POST"
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

    function normalizeMoviePayload(movie) {
        return {
            title: readText(movie.title),
            year: toNumberOrZero(movie.year),
            genre: readText(movie.genre),
            duration: toNumberOrZero(movie.duration),
            synopsis: readText(movie.synopsis),
            posterUrl: readText(movie.posterUrl)
        };
    }

    function adminHeaders(session) {
        const role = isAdminSession(session) ? session.role : ADMIN_ROLE;
        return {
            "Content-Type": "application/json",
            "X-User-Role": role
        };
    }

    async function fetchMovies(filters, endpoint = MOVIES_ENDPOINT) {
        const data = await requestJson(`${endpoint}${buildMovieQuery(filters)}`);
        return Array.isArray(data) ? data : [];
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

    function createMovieCard(movie, options = {}) {
        const adminMode = Boolean(options.adminMode);
        const showStatusButtons = Boolean(options.showStatusButtons);
        const status = options.status || createEmptyStatus(movie.id);
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

        if (showStatusButtons) {
            body.append(createStatusActions(status));
        }

        if (adminMode) {
            const actions = document.createElement("div");
            actions.className = "admin-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "action-button edit";
            editButton.dataset.action = "edit";
            editButton.dataset.movieId = String(movie.id);
            editButton.textContent = "Edit";

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "action-button delete";
            deleteButton.dataset.action = "delete";
            deleteButton.dataset.movieId = String(movie.id);
            deleteButton.textContent = "Delete";

            actions.append(editButton, deleteButton);
            body.append(actions);
        }

        return card;
    }

    function renderMovies(gridElement, movies, adminMode) {
        gridElement.innerHTML = "";

        if (!Array.isArray(movies) || movies.length === 0) {
            const empty = document.createElement("article");
            empty.className = "movie-card empty";
            empty.textContent = "No movies found for current filters.";
            gridElement.append(empty);
            return;
        }

        movies.forEach((movie) => {
            gridElement.append(createMovieCard(movie.movie || movie, {
                adminMode,
                showStatusButtons: !adminMode,
                status: movie.status || createEmptyStatus(movie.movie?.id || movie.id)
            }));
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

    function resetAdminForm(formElement) {
        if (!formElement) {
            return;
        }
        formElement.reset();
        const idInput = formElement.querySelector("#admin-movie-id");
        if (idInput) {
            idInput.value = "";
        }
        updatePosterPreview(formElement);
    }

    function fillAdminForm(formElement, movie) {
        const idInput = formElement.querySelector("#admin-movie-id");
        const title = formElement.querySelector("#admin-title");
        const year = formElement.querySelector("#admin-year");
        const genre = formElement.querySelector("#admin-genre");
        const duration = formElement.querySelector("#admin-duration");
        const synopsis = formElement.querySelector("#admin-synopsis");
        const posterUrl = formElement.querySelector("#admin-poster-url");

        if (idInput) {
            idInput.value = String(movie.id || "");
        }
        if (title) {
            title.value = readText(movie.title);
        }
        if (year) {
            year.value = toNumberOrZero(movie.year) || "";
        }
        if (genre) {
            genre.value = readText(movie.genre);
        }
        if (duration) {
            duration.value = toNumberOrZero(movie.duration) || "";
        }
        if (synopsis) {
            synopsis.value = readText(movie.synopsis);
        }
        if (posterUrl) {
            posterUrl.value = readText(movie.posterUrl);
        }
        updatePosterPreview(formElement);
    }

    function formToMovie(formElement) {
        return normalizeMoviePayload({
            title: formElement.querySelector("#admin-title")?.value,
            year: formElement.querySelector("#admin-year")?.value,
            genre: formElement.querySelector("#admin-genre")?.value,
            duration: formElement.querySelector("#admin-duration")?.value,
            synopsis: formElement.querySelector("#admin-synopsis")?.value,
            posterUrl: formElement.querySelector("#admin-poster-url")?.value
        });
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

    function openAdminModal(modalElement) {
        if (!modalElement) {
            return;
        }
        modalElement.classList.remove("hidden");
        modalElement.setAttribute("aria-hidden", "false");
        const titleInput = modalElement.querySelector("#admin-title");
        if (titleInput) {
            titleInput.focus();
        }
    }

    function closeAdminModal(modalElement) {
        if (!modalElement) {
            return;
        }
        modalElement.classList.add("hidden");
        modalElement.setAttribute("aria-hidden", "true");
    }

    function setModalMode(mode, movie) {
        const title = document.getElementById("admin-modal-title");
        const label = document.getElementById("admin-mode-label");
        const modal = document.getElementById("admin-modal");
        const isEdit = mode === "edit";

        if (modal) {
            modal.dataset.mode = mode;
        }
        if (title) {
            title.textContent = isEdit ? "Edit Movie" : "Add New Movie";
        }
        if (label) {
            label.textContent = isEdit
                ? `Movie #${movie?.id || ""}`
                : "New catalog entry";
        }
    }

    function createPosterThumb(movie) {
        const wrapper = document.createElement("div");
        wrapper.className = "poster-thumb";

        const posterUrl = readText(movie.posterUrl);
        if (posterUrl) {
            const image = document.createElement("img");
            image.src = posterUrl;
            image.alt = `${readText(movie.title) || "Movie"} poster`;
            wrapper.append(image);
        } else {
            const icon = document.createElement("span");
            icon.className = "material-symbols-outlined";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "movie";
            wrapper.append(icon);
        }

        return wrapper;
    }

    function createIconButton(action, icon, label, movieId) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `table-icon-button ${action}`;
        button.dataset.action = action;
        button.dataset.movieId = String(movieId);
        button.setAttribute("aria-label", label);

        const iconElement = document.createElement("span");
        iconElement.className = "material-symbols-outlined";
        iconElement.setAttribute("aria-hidden", "true");
        iconElement.textContent = icon;

        button.append(iconElement);
        return button;
    }

    function createAdminTableRow(movie, adminMode = true) {
        const row = document.createElement("tr");
        row.dataset.movieId = String(movie.id);

        const posterCell = document.createElement("td");
        posterCell.append(createPosterThumb(movie));

        const title = document.createElement("td");
        title.className = "table-title";
        const titleText = document.createElement("strong");
        titleText.textContent = readText(movie.title) || "Untitled";
        const synopsis = document.createElement("span");
        synopsis.textContent = movieDescription(movie);
        title.append(titleText, synopsis);

        const genre = document.createElement("td");
        const genreChip = document.createElement("span");
        genreChip.className = "table-chip";
        genreChip.textContent = readText(movie.genre) || "Unknown";
        genre.append(genreChip);

        const year = document.createElement("td");
        year.textContent = movieYear(movie);

        const duration = document.createElement("td");
        duration.textContent = movieDuration(movie);

        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "table-actions";

        if (adminMode) {
            actions.append(
                createIconButton("edit", "edit", `Edit ${readText(movie.title) || "movie"}`, movie.id),
                createIconButton("delete", "delete", `Delete ${readText(movie.title) || "movie"}`, movie.id)
            );
        }

        actionsCell.append(actions);
        row.append(posterCell, title, genre, year, duration, actionsCell);
        return row;
    }

    function createEmptyTableRow(titleText, bodyText) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        const strong = document.createElement("strong");
        const span = document.createElement("span");

        cell.colSpan = 6;
        cell.className = "table-empty";
        strong.textContent = titleText;
        span.textContent = bodyText;
        cell.append(strong, span);
        row.append(cell);
        return row;
    }

    function renderAdminTable(tableBody, movies, adminMode = true) {
        tableBody.innerHTML = "";

        if (!Array.isArray(movies) || movies.length === 0) {
            tableBody.append(createEmptyTableRow("No movies found", "Adjust filters or add a new movie."));
            return;
        }

        movies.forEach((movie) => {
            tableBody.append(createAdminTableRow(movie, adminMode));
        });
    }

    function getMovieGenres(movies) {
        const genres = new Set(DEFAULT_GENRES);
        movies.forEach((movie) => {
            const genre = readText(movie.genre);
            if (genre) {
                genres.add(genre);
            }
        });
        return Array.from(genres).sort(compareText);
    }

    function populateGenreControls(movies) {
        const genres = getMovieGenres(movies);
        const filter = document.getElementById("admin-genre-filter");
        const datalist = document.getElementById("admin-genre-options");

        if (filter) {
            const current = filter.value || "all";
            filter.innerHTML = "";

            const allOption = document.createElement("option");
            allOption.value = "all";
            allOption.textContent = "All genres";
            filter.append(allOption);

            genres.forEach((genre) => {
                const option = document.createElement("option");
                option.value = genre;
                option.textContent = genre;
                filter.append(option);
            });

            filter.value = Array.from(filter.options).some((option) => option.value === current)
                ? current
                : "all";
        }

        if (datalist) {
            datalist.innerHTML = "";
            genres.forEach((genre) => {
                const option = document.createElement("option");
                option.value = genre;
                datalist.append(option);
            });
        }
    }

    function applyAdminFilters(movies, filters) {
        const query = readText(filters?.query).toLowerCase();
        const genre = readText(filters?.genre);
        const year = readText(filters?.year);

        return movies.filter((movie) => {
            const movieGenre = readText(movie.genre);
            const matchesGenre = !genre || genre.toLowerCase() === "all" || movieGenre.toLowerCase() === genre.toLowerCase();
            const matchesYear = !year || movieYear(movie) === year;
            const haystack = [
                movie.title,
                movie.genre,
                movie.synopsis,
                movie.year,
                movie.duration
            ].map(readText).join(" ").toLowerCase();
            const matchesQuery = !query || haystack.includes(query);
            return matchesGenre && matchesYear && matchesQuery;
        });
    }

    function sortMovies(movies, sortKey) {
        const sorted = [...movies];
        const key = readText(sortKey) || "title";

        sorted.sort((left, right) => {
            if (key === "newest") {
                return toNumberOrZero(right.year) - toNumberOrZero(left.year) || compareText(left.title, right.title);
            }
            if (key === "oldest") {
                return toNumberOrZero(left.year) - toNumberOrZero(right.year) || compareText(left.title, right.title);
            }
            if (key === "genre") {
                return compareText(left.genre, right.genre) || compareText(left.title, right.title);
            }
            if (key === "duration") {
                return toNumberOrZero(right.duration) - toNumberOrZero(left.duration) || compareText(left.title, right.title);
            }
            return compareText(left.title, right.title);
        });

        return sorted;
    }

    function renderAdminStats(movies) {
        const totalElement = document.getElementById("admin-total");
        const genreElement = document.getElementById("admin-genres");
        const latestElement = document.getElementById("admin-latest");
        const durationElement = document.getElementById("admin-average-duration");

        const validYears = movies.map((movie) => toNumberOrZero(movie.year)).filter((year) => year > 0);
        const validDurations = movies.map((movie) => toNumberOrZero(movie.duration)).filter((duration) => duration > 0);
        const genres = new Set(movies.map((movie) => readText(movie.genre)).filter(Boolean));

        if (totalElement) {
            totalElement.textContent = String(movies.length);
        }
        if (genreElement) {
            genreElement.textContent = String(genres.size);
        }
        if (latestElement) {
            latestElement.textContent = validYears.length ? String(Math.max(...validYears)) : "N/A";
        }
        if (durationElement) {
            const average = validDurations.length
                ? Math.round(validDurations.reduce((sum, value) => sum + value, 0) / validDurations.length)
                : 0;
            durationElement.textContent = average ? `${average}m` : "N/A";
        }
    }

    function renderAdminPagination(state, total) {
        const range = document.getElementById("admin-range");
        const prev = document.getElementById("admin-prev");
        const next = document.getElementById("admin-next");
        const pageList = document.getElementById("admin-page-list");
        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));

        state.totalPages = totalPages;
        state.page = Math.min(Math.max(state.page, 1), totalPages);

        if (range) {
            if (!total) {
                range.textContent = "No entries";
            } else {
                const start = (state.page - 1) * state.pageSize + 1;
                const end = Math.min(start + state.pageSize - 1, total);
                range.textContent = `Showing ${start} to ${end} of ${total} entries`;
            }
        }

        if (prev) {
            prev.disabled = state.page <= 1;
        }
        if (next) {
            next.disabled = state.page >= totalPages;
        }
        if (pageList) {
            pageList.innerHTML = "";
            const startPage = Math.max(1, state.page - 2);
            const endPage = Math.min(totalPages, startPage + 4);

            for (let page = startPage; page <= endPage; page += 1) {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `page-button${page === state.page ? " active" : ""}`;
                button.dataset.page = String(page);
                button.textContent = String(page);
                pageList.append(button);
            }
        }
    }

    function getAdminVisibleMovies(state) {
        return sortMovies(applyAdminFilters(state.movies, state.filters), state.filters.sort);
    }

    function renderAdminDashboard(state, elements, adminMode) {
        const visibleMovies = getAdminVisibleMovies(state);
        renderAdminPagination(state, visibleMovies.length);

        const start = (state.page - 1) * state.pageSize;
        const pageMovies = visibleMovies.slice(start, start + state.pageSize);

        renderAdminStats(state.movies);
        renderAdminTable(elements.tableBody, pageMovies, adminMode);
    }

    function updatePosterPreview(formElement) {
        if (!formElement || typeof document === "undefined") {
            return;
        }

        const previewImage = document.getElementById("admin-poster-preview");
        const placeholder = document.getElementById("admin-poster-placeholder");
        const posterUrl = readText(formElement.querySelector("#admin-poster-url")?.value);

        if (!previewImage || !placeholder) {
            return;
        }

        if (posterUrl) {
            previewImage.hidden = false;
            placeholder.hidden = true;
            previewImage.src = posterUrl;
        } else {
            previewImage.hidden = true;
            previewImage.removeAttribute("src");
            placeholder.hidden = false;
        }
    }

    function setFormBusy(formElement, busy) {
        const submit = formElement?.querySelector("button[type='submit']");
        if (submit) {
            submit.disabled = busy;
        }
    }

    function setSearchInputsValue(inputs, value, source) {
        inputs.forEach((input) => {
            if (input !== source) {
                input.value = value;
            }
        });
    }

    function findMovieById(movies, movieId) {
        return movies.find((item) => String(item.id) === String(movieId));
    }

    function bindAdminFilters(state, elements, adminMode) {
        elements.searchInputs.forEach((input) => {
            input.addEventListener("input", () => {
                state.filters.query = input.value;
                state.page = 1;
                setSearchInputsValue(elements.searchInputs, input.value, input);
                renderAdminDashboard(state, elements, adminMode);
            });
        });

        elements.genreFilter?.addEventListener("change", () => {
            state.filters.genre = elements.genreFilter.value;
            state.page = 1;
            renderAdminDashboard(state, elements, adminMode);
        });

        elements.yearFilter?.addEventListener("input", () => {
            state.filters.year = elements.yearFilter.value;
            state.page = 1;
            renderAdminDashboard(state, elements, adminMode);
        });

        elements.sortSelect?.addEventListener("change", () => {
            state.filters.sort = elements.sortSelect.value;
            state.page = 1;
            renderAdminDashboard(state, elements, adminMode);
        });

        elements.clearFilters?.addEventListener("click", () => {
            state.filters = {
                query: "",
                genre: "all",
                year: "",
                sort: "title"
            };
            state.page = 1;
            setSearchInputsValue(elements.searchInputs, "", null);
            if (elements.genreFilter) {
                elements.genreFilter.value = "all";
            }
            if (elements.yearFilter) {
                elements.yearFilter.value = "";
            }
            if (elements.sortSelect) {
                elements.sortSelect.value = "title";
            }
            renderAdminDashboard(state, elements, adminMode);
        });
    }

    function bindAdminPagination(state, elements, adminMode) {
        elements.prevButton?.addEventListener("click", () => {
            if (state.page > 1) {
                state.page -= 1;
                renderAdminDashboard(state, elements, adminMode);
            }
        });

        elements.nextButton?.addEventListener("click", () => {
            if (state.page < state.totalPages) {
                state.page += 1;
                renderAdminDashboard(state, elements, adminMode);
            }
        });

        elements.pageList?.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-page]");
            if (!button) {
                return;
            }
            state.page = toNumberOrZero(button.dataset.page) || 1;
            renderAdminDashboard(state, elements, adminMode);
        });
    }

    async function initCatalogGridPage() {
        const gridElement = document.getElementById("catalog-grid");
        if (!gridElement) {
            return false;
        }

        const titleInput = document.getElementById("title");
        const genreInput = document.getElementById("genre");
        const yearInput = document.getElementById("year");
        const adminPanel = document.getElementById("admin-panel");
        const adminForm = document.getElementById("admin-form");
        const adminMessage = document.getElementById("admin-message");
        const catalogMessage = document.getElementById("catalog-message");
        const goAdminButton = document.getElementById("go-admin-dashboard");

        const session = getSessionInfo();
        const adminMode = isAdminSession(session);
        const inlineAdminMode = adminMode && Boolean(adminForm);

        updateSessionUi(session);
        bindLogoutAction();
        toggleAdminLinks(adminMode);

        if (goAdminButton && adminMode) {
            goAdminButton.addEventListener("click", () => {
                if (scope.window && scope.window.location) {
                    scope.window.location.assign(ADMIN_DASHBOARD_URL);
                }
            });
        }

        if (adminPanel) {
            adminPanel.hidden = !inlineAdminMode;
        }

        const state = {
            filters: {
                title: "",
                genre: "all",
                year: ""
            },
            movies: []
        };

        async function reloadMovies() {
            try {
                const movies = await fetchMovies(state.filters);
                const userId = getUserId();

                state.movies = inlineAdminMode
                    ? movies
                    : await Promise.all((Array.isArray(movies) ? movies : []).map(async (movie) => ({
                        movie,
                        status: await fetchStatusForMovie(userId, movie.id)
                    })));

                renderMovies(gridElement, state.movies, inlineAdminMode);
                setStatus(catalogMessage, "", false);
            } catch (error) {
                renderMovies(gridElement, [], inlineAdminMode);
                setStatus(catalogMessage, error.message, true);
            }
        }

        titleInput?.addEventListener("input", () => {
            state.filters.title = titleInput.value;
            reloadMovies();
        });

        genreInput?.addEventListener("change", () => {
            state.filters.genre = genreInput.value;
            reloadMovies();
        });

        yearInput?.addEventListener("input", () => {
            state.filters.year = yearInput.value;
            reloadMovies();
        });

        if (!inlineAdminMode) {
            gridElement.addEventListener("click", async (event) => {
                const button = event.target.closest(".status-action-button");
                if (!button) {
                    return;
                }

                const card = event.target.closest(".movie-card");
                const movieId = Number.parseInt(card?.dataset.movieId || "", 10);
                const action = button.dataset.action;
                const isActive = button.classList.contains("active");

                if (!movieId || !action) {
                    return;
                }

                const userId = ensureUserId();
                if (!userId) {
                    setStatus(catalogMessage, "You need a userId to save movie states.", true);
                    return;
                }

                try {
                    button.disabled = true;
                    const status = await applyStatusAction(userId, movieId, action, isActive);
                    updateStatusButtons(card, status || createEmptyStatus(movieId));
                    setStatus(catalogMessage, "Status updated successfully", false);
                } catch (error) {
                    setStatus(catalogMessage, error.message || "Error updating movie status", true);
                } finally {
                    button.disabled = false;
                }
            });
        }

        if (inlineAdminMode) {
            gridElement.addEventListener("click", async (event) => {
                const button = event.target.closest("button[data-action]");
                if (!button) {
                    return;
                }

                const movieId = Number.parseInt(button.dataset.movieId || "", 10);
                const movie = findMovieById(state.movies, movieId);
                if (!movie) {
                    setStatus(adminMessage, "Movie not found", true);
                    return;
                }

                if (button.dataset.action === "edit") {
                    fillAdminForm(adminForm, movie);
                    setStatus(adminMessage, `Editing movie #${movieId}`, false);
                    return;
                }

                if (button.dataset.action === "delete") {
                    try {
                        await requestJson(`${MOVIES_ENDPOINT}/${movieId}`, {
                            method: "DELETE",
                            headers: adminHeaders(session)
                        });
                        setStatus(adminMessage, `Movie #${movieId} deleted`, false);
                        await reloadMovies();
                    } catch (error) {
                        setStatus(adminMessage, error.message, true);
                    }
                }
            });

            adminForm.addEventListener("submit", async (event) => {
                event.preventDefault();
                const idValue = adminForm.querySelector("#admin-movie-id")?.value || "";
                const movieId = Number.parseInt(idValue, 10);

                if (!movieId) {
                    setStatus(adminMessage, "Select a movie to edit", true);
                    return;
                }

                const payload = formToMovie(adminForm);
                try {
                    await requestJson(`${MOVIES_ENDPOINT}/${movieId}`, {
                        method: "PUT",
                        headers: adminHeaders(session),
                        body: JSON.stringify(payload)
                    });
                    setStatus(adminMessage, `Movie #${movieId} updated`, false);
                    await reloadMovies();
                } catch (error) {
                    setStatus(adminMessage, error.message, true);
                }
            });

            const clearButton = adminForm.querySelector("#admin-clear");
            clearButton?.addEventListener("click", () => {
                resetAdminForm(adminForm);
                setStatus(adminMessage, "", false);
            });
        }

        await reloadMovies();
        return true;
    }

    async function initAdminDashboardPage() {
        const tableBody = document.getElementById("admin-table-body");
        if (!tableBody) {
            return false;
        }

        const session = getSessionInfo();
        const adminMode = isAdminSession(session);
        const state = {
            movies: [],
            page: 1,
            pageSize: ADMIN_PAGE_SIZE,
            totalPages: 1,
            filters: {
                query: "",
                genre: "all",
                year: "",
                sort: "title"
            }
        };
        const elements = {
            tableBody,
            catalogMessage: document.getElementById("catalog-message"),
            adminMessage: document.getElementById("admin-message"),
            modalElement: document.getElementById("admin-modal"),
            overlayElement: document.getElementById("admin-overlay"),
            closeButton: document.getElementById("admin-close"),
            cancelButton: document.getElementById("admin-cancel"),
            adminForm: document.getElementById("admin-form"),
            clearButton: document.getElementById("admin-clear"),
            createButtons: Array.from(document.querySelectorAll("[data-admin-create]")),
            searchInputs: Array.from(document.querySelectorAll("[data-admin-search]")),
            genreFilter: document.getElementById("admin-genre-filter"),
            yearFilter: document.getElementById("admin-year-filter"),
            sortSelect: document.getElementById("admin-sort"),
            clearFilters: document.getElementById("admin-clear-filters"),
            prevButton: document.getElementById("admin-prev"),
            nextButton: document.getElementById("admin-next"),
            pageList: document.getElementById("admin-page-list"),
            posterUrl: document.getElementById("admin-poster-url"),
            posterPreview: document.getElementById("admin-poster-preview")
        };

        updateSessionUi(session);
        bindLogoutAction();

        if (!adminMode) {
            document.body.classList.add("admin-locked");
            renderAdminStats([]);
            renderAdminPagination(state, 0);
            tableBody.innerHTML = "";
            tableBody.append(createEmptyTableRow("Admin access required", "Log in with an admin account to manage movies."));
            setStatus(elements.catalogMessage, "Admin role required to access this page.", true);
            return true;
        }

        async function reloadMovies(successMessage) {
            try {
                state.movies = await fetchMovies({ title: "", genre: "all", year: "" });
                populateGenreControls(state.movies);
                renderAdminDashboard(state, elements, adminMode);
                setStatus(elements.catalogMessage, successMessage || "", false);
            } catch (error) {
                state.movies = [];
                renderAdminDashboard(state, elements, adminMode);
                setStatus(elements.catalogMessage, error.message, true);
            }
        }

        function startCreate() {
            if (!elements.adminForm) {
                return;
            }
            resetAdminForm(elements.adminForm);
            setModalMode("create");
            setStatus(elements.adminMessage, "", false);
            openAdminModal(elements.modalElement);
        }

        function startEdit(movie) {
            if (!elements.adminForm) {
                return;
            }
            fillAdminForm(elements.adminForm, movie);
            setModalMode("edit", movie);
            setStatus(elements.adminMessage, "", false);
            openAdminModal(elements.modalElement);
        }

        elements.createButtons.forEach((button) => {
            button.addEventListener("click", startCreate);
        });

        elements.closeButton?.addEventListener("click", () => {
            closeAdminModal(elements.modalElement);
        });

        elements.cancelButton?.addEventListener("click", () => {
            closeAdminModal(elements.modalElement);
        });

        elements.overlayElement?.addEventListener("click", () => {
            closeAdminModal(elements.modalElement);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeAdminModal(elements.modalElement);
            }
        });

        elements.clearButton?.addEventListener("click", () => {
            if (!elements.adminForm) {
                return;
            }
            const movieId = elements.adminForm.querySelector("#admin-movie-id")?.value;
            const movie = movieId ? findMovieById(state.movies, movieId) : null;
            if (movie) {
                fillAdminForm(elements.adminForm, movie);
            } else {
                resetAdminForm(elements.adminForm);
            }
            setStatus(elements.adminMessage, "", false);
        });

        elements.posterUrl?.addEventListener("input", () => {
            updatePosterPreview(elements.adminForm);
        });

        elements.posterPreview?.addEventListener("error", () => {
            elements.posterPreview.hidden = true;
            const placeholder = document.getElementById("admin-poster-placeholder");
            if (placeholder) {
                placeholder.hidden = false;
            }
        });

        bindAdminFilters(state, elements, adminMode);
        bindAdminPagination(state, elements, adminMode);

        tableBody.addEventListener("click", async (event) => {
            const button = event.target.closest("button[data-action]");
            if (!button) {
                return;
            }

            const movieId = button.dataset.movieId || "";
            const movie = findMovieById(state.movies, movieId);
            if (!movie) {
                setStatus(elements.catalogMessage, "Movie not found", true);
                return;
            }

            if (button.dataset.action === "edit") {
                startEdit(movie);
                return;
            }

            if (button.dataset.action === "delete") {
                try {
                    setStatus(elements.catalogMessage, `Deleting ${readText(movie.title) || "movie"}...`, false);
                    await requestJson(`${MOVIES_ENDPOINT}/${movieId}`, {
                        method: "DELETE",
                        headers: adminHeaders(session)
                    });
                    await reloadMovies(`Deleted ${readText(movie.title) || "movie"}`);
                } catch (error) {
                    setStatus(elements.catalogMessage, error.message, true);
                }
            }
        });

        elements.adminForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (typeof elements.adminForm.checkValidity === "function" && !elements.adminForm.checkValidity()) {
                if (typeof elements.adminForm.reportValidity === "function") {
                    elements.adminForm.reportValidity();
                }
                setStatus(elements.adminMessage, "Complete the required movie fields.", true);
                return;
            }

            const idValue = elements.adminForm.querySelector("#admin-movie-id")?.value || "";
            const movieId = Number.parseInt(idValue, 10);
            const payload = formToMovie(elements.adminForm);

            if (!payload.title || !payload.genre || !payload.year || !payload.duration) {
                setStatus(elements.adminMessage, "Title, genre, year, and duration are required.", true);
                return;
            }

            try {
                setFormBusy(elements.adminForm, true);

                if (movieId) {
                    await requestJson(`${MOVIES_ENDPOINT}/${movieId}`, {
                        method: "PUT",
                        headers: adminHeaders(session),
                        body: JSON.stringify(payload)
                    });
                    await reloadMovies(`Updated ${payload.title}`);
                } else {
                    await requestJson(MOVIES_ENDPOINT, {
                        method: "POST",
                        headers: adminHeaders(session),
                        body: JSON.stringify(payload)
                    });
                    await reloadMovies(`Created ${payload.title}`);
                }

                closeAdminModal(elements.modalElement);
                resetAdminForm(elements.adminForm);
                setStatus(elements.adminMessage, "", false);
            } catch (error) {
                setStatus(elements.adminMessage, error.message, true);
            } finally {
                setFormBusy(elements.adminForm, false);
            }
        });

        await reloadMovies();
        return true;
    }

    async function initCatalog() {
        const adminInitialized = await initAdminDashboardPage();
        if (adminInitialized) {
            return;
        }
        await initCatalogGridPage();
    }

    const exportsObject = {
        buildMovieQuery,
        getSessionInfo,
        isAdminSession,
        requestJson,
        normalizeMoviePayload,
        fetchMovies,
        createMovieCard,
        renderMovies,
        bindLogoutAction,
        toggleAdminLinks,
        openAdminModal,
        closeAdminModal,
        setStatus,
        resetAdminForm,
        fillAdminForm,
        applyAdminFilters,
        sortMovies,
        renderAdminTable,
        renderAdminStats,
        renderAdminPagination,
        updatePosterPreview,
        initCatalogGridPage,
        initAdminDashboardPage,
        initCatalog
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = exportsObject;
    }

    if (scope && typeof scope.window !== "undefined") {
        scope.window.MovieCatalog = exportsObject;
        if (!scope.window.__MOVIE_CATALOG_DISABLE_AUTO_INIT__) {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", initCatalog);
            } else {
                initCatalog();
            }
        }
    }
})(typeof globalThis !== "undefined" ? globalThis : this);
