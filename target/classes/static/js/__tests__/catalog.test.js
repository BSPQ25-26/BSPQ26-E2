const http = require("http");

window.__MOVIE_CATALOG_DISABLE_AUTO_INIT__ = true;
const catalog = require("../catalog.js");

function setupCatalogDom() {
    document.body.innerHTML = `
        <section class="controls">
            <input id="title" />
            <select id="genre"><option value="all" selected>All</option><option value="Drama">Drama</option></select>
            <input id="year" />
        </section>
        <p id="session-user"></p>
        <button type="button" id="go-admin-dashboard" data-admin-link hidden>Admin</button>
        <button type="button" data-action="logout">Logout</button>
        <section id="admin-panel" hidden>
            <form id="admin-form">
                <input type="hidden" id="admin-movie-id" />
                <input id="admin-title" />
                <input id="admin-year" />
                <input id="admin-genre" />
                <input id="admin-duration" />
                <textarea id="admin-synopsis"></textarea>
                <input id="admin-poster-url" />
                <button type="submit">Save</button>
                <button id="admin-clear" type="button">Clear</button>
            </form>
        </section>
        <p id="admin-message"></p>
        <p id="catalog-message"></p>
        <section id="catalog-grid"></section>
    `;
}

function setupAdminDom() {
    document.body.className = "admin-page";
    document.body.innerHTML = `
        <p id="session-user"></p>
        <button type="button" data-action="logout">Logout</button>
        <button type="button" data-admin-create data-admin-only>Add</button>
        <input id="admin-top-search" data-admin-search />
        <input id="admin-search" data-admin-search />
        <select id="admin-genre-filter"><option value="all">All genres</option></select>
        <input id="admin-year-filter" />
        <select id="admin-sort">
            <option value="title">Title A-Z</option>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="genre">Genre</option>
            <option value="duration">Runtime</option>
        </select>
        <button type="button" id="admin-clear-filters">Clear</button>
        <strong id="admin-total"></strong>
        <strong id="admin-genres"></strong>
        <strong id="admin-latest"></strong>
        <strong id="admin-average-duration"></strong>
        <p id="catalog-message"></p>
        <table><tbody id="admin-table-body"></tbody></table>
        <span id="admin-range"></span>
        <button type="button" id="admin-prev"></button>
        <div id="admin-page-list"></div>
        <button type="button" id="admin-next"></button>
        <section id="admin-modal" class="hidden" aria-hidden="true">
            <button type="button" id="admin-close">Close</button>
            <button type="button" id="admin-cancel">Cancel</button>
            <div id="admin-overlay"></div>
            <h3 id="admin-modal-title"></h3>
            <p id="admin-mode-label"></p>
            <form id="admin-form">
                <input type="hidden" id="admin-movie-id" />
                <input id="admin-title" required />
                <input id="admin-year" type="number" required />
                <input id="admin-genre" required />
                <input id="admin-duration" type="number" required />
                <textarea id="admin-synopsis"></textarea>
                <input id="admin-poster-url" />
                <img id="admin-poster-preview" alt="" hidden />
                <span id="admin-poster-placeholder"></span>
                <button type="button" id="admin-clear">Reset</button>
                <button type="submit">Save</button>
            </form>
            <p id="admin-message"></p>
        </section>
        <datalist id="admin-genre-options"></datalist>
    `;
}

function movie(id, overrides = {}) {
    return {
        id,
        title: `Movie ${id}`,
        genre: id % 2 === 0 ? "Drama" : "Sci-Fi",
        year: 2000 + id,
        duration: 90 + id,
        synopsis: `Synopsis ${id}`,
        posterUrl: "",
        ...overrides
    };
}

function jsonResponse(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: () => "application/json"
        },
        json: async () => body,
        text: async () => JSON.stringify(body)
    };
}

function textResponse(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: () => "text/plain"
        },
        json: async () => {
            throw new Error("Not JSON");
        },
        text: async () => body
    };
}

function createHttpFetch(baseUrl, calls) {
    return (input, options = {}) => new Promise((resolve, reject) => {
        const method = (options.method || "GET").toUpperCase();
        const requestUrl = typeof input === "string" ? input : input.url;
        const target = new URL(requestUrl, baseUrl);

        calls.push({
            method,
            path: `${target.pathname}${target.search}`
        });

        const req = http.request(target, {
            method,
            headers: options.headers || {}
        }, (res) => {
            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });
            res.on("end", () => {
                resolve({
                    ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
                    status: res.statusCode || 0,
                    headers: {
                        get: (name) => {
                            const value = res.headers[String(name).toLowerCase()];
                            if (Array.isArray(value)) {
                                return value.join(", ");
                            }
                            return value ? String(value) : null;
                        }
                    },
                    json: async () => (body ? JSON.parse(body) : {}),
                    text: async () => body
                });
            });
        });

        req.on("error", reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function settle() {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("catalog client logic", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        sessionStorage.clear();
        document.body.innerHTML = "";
        document.body.className = "";
    });

    test("buildMovieQuery creates query string from filters", () => {
        expect(catalog.buildMovieQuery({ title: "", genre: "all", year: "" })).toBe("");
        expect(catalog.buildMovieQuery({ title: "Inception", genre: "Sci-Fi", year: "2010" }))
            .toBe("?query=Inception&genre=Sci-Fi&year=2010");
    });

    test("getSessionInfo handles malformed storage", () => {
        const badStorage = {
            getItem: () => "{invalid-json"
        };

        expect(catalog.getSessionInfo(badStorage)).toBeNull();
    });

    test("getSessionInfo supports empty, invalid and legacy sessions", () => {
        expect(catalog.getSessionInfo(null)).toBeNull();
        expect(catalog.getSessionInfo({ getItem: () => null })).toBeNull();
        expect(catalog.getSessionInfo({ getItem: () => "42" })).toBeNull();

        const legacyStorage = {
            getItem: (key) => key === "movieTracker.session"
                ? JSON.stringify({ username: "legacy", role: "ADMIN" })
                : null
        };

        expect(catalog.getSessionInfo(legacyStorage)).toEqual({ username: "legacy", role: "ADMIN" });
    });

    test("isAdminSession validates role", () => {
        expect(catalog.isAdminSession({ role: "ADMIN" })).toBe(true);
        expect(catalog.isAdminSession({ role: "USER" })).toBe(false);
        expect(catalog.isAdminSession(null)).toBe(false);
    });

    test("normalizeMoviePayload sanitizes values", () => {
        const payload = catalog.normalizeMoviePayload({
            title: "  Alien  ",
            year: "1979",
            genre: " Sci-Fi ",
            duration: " 117 ",
            synopsis: "  Classic  ",
            posterUrl: " https://img "
        });

        expect(payload).toEqual({
            title: "Alien",
            year: 1979,
            genre: "Sci-Fi",
            duration: 117,
            synopsis: "Classic",
            posterUrl: "https://img"
        });
    });

    test("requestJson returns json for successful response", async () => {
        global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { ok: true }));

        const response = await catalog.requestJson("/api/movies");

        expect(response).toEqual({ ok: true });
    });

    test("requestJson throws message for error response", async () => {
        global.fetch = jest.fn().mockResolvedValue(textResponse(403, "Admin role required"));

        await expect(catalog.requestJson("/api/movies/1", { method: "DELETE" }))
            .rejects
            .toThrow("Admin role required");
    });

    test("requestJson and fetchMovies handle non-standard responses", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            headers: { get: () => "application/json" },
            json: async () => {
                throw new Error("bad json");
            },
            text: async () => "ignored"
        });

        await expect(catalog.requestJson("/api/movies")).resolves.toBe("");

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            headers: null,
            text: async () => "plain text"
        });

        await expect(catalog.requestJson("/plain")).resolves.toBe("plain text");
        await expect(catalog.fetchMovies({ title: "" }, "/plain")).resolves.toEqual([]);
    });

    test("renderMovies supports empty and admin card states", () => {
        const grid = document.createElement("section");

        catalog.renderMovies(grid, [], false);
        expect(grid.querySelector(".movie-card.empty")).not.toBeNull();

        catalog.renderMovies(grid, [{ id: 1, title: "Inception", genre: "Sci-Fi", year: 2010 }], true);
        expect(grid.querySelector("[data-action='edit']")).not.toBeNull();
        expect(grid.querySelector("[data-action='delete']")).not.toBeNull();

        const card = catalog.createMovieCard({
            id: 2,
            title: "",
            genre: "",
            year: 0,
            duration: 0,
            synopsis: "",
            posterUrl: "https://poster.example/image.jpg"
        }, false);

        expect(card.querySelector("img").src).toContain("https://poster.example/image.jpg");
        expect(card.textContent).toContain("Untitled");
        expect(card.textContent).toContain("Unknown");
        expect(card.textContent).toContain("N/A");
        expect(card.textContent).toContain("TBD");
    });

    test("form and status helpers cover defensive branches", () => {
        expect(() => catalog.setStatus(null, "Ignored", true)).not.toThrow();
        expect(() => catalog.resetAdminForm(null)).not.toThrow();
        expect(() => catalog.updatePosterPreview(null)).not.toThrow();

        const status = document.createElement("p");
        catalog.setStatus(status, "Saved", false);
        expect(status.classList.contains("success")).toBe(true);
        catalog.setStatus(status, "Failed", true);
        expect(status.classList.contains("error")).toBe(true);
        catalog.setStatus(status, "", false);
        expect(status.className).toBe("");

        document.body.innerHTML = `
            <form id="minimal-form">
                <input id="admin-title" />
                <input id="admin-year" />
            </form>
            <img id="admin-poster-preview" hidden />
            <span id="admin-poster-placeholder"></span>
        `;

        const minimalForm = document.getElementById("minimal-form");
        catalog.fillAdminForm(minimalForm, { id: null, title: "Minimal", year: 0 });
        expect(document.getElementById("admin-title").value).toBe("Minimal");
        expect(document.getElementById("admin-year").value).toBe("");

        catalog.resetAdminForm(minimalForm);
        expect(document.getElementById("admin-poster-preview").hidden).toBe(true);

        document.body.innerHTML = `
            <form id="poster-form">
                <input id="admin-poster-url" value="https://poster.example/a.jpg" />
            </form>
        `;
        expect(() => catalog.updatePosterPreview(document.getElementById("poster-form"))).not.toThrow();
    });

    test("shared page helpers toggle admin links, modals and bound logout actions", async () => {
        document.body.innerHTML = `
            <button type="button" data-admin-link hidden>Admin</button>
            <button type="button" data-action="logout">Logout</button>
            <section id="modal" class="hidden" aria-hidden="true">
                <input id="admin-title" />
            </section>
        `;

        await expect(catalog.initCatalogGridPage()).resolves.toBe(false);
        await expect(catalog.initAdminDashboardPage()).resolves.toBe(false);
        expect(() => catalog.openAdminModal(null)).not.toThrow();
        expect(() => catalog.closeAdminModal(null)).not.toThrow();

        const adminLink = document.querySelector("[data-admin-link]");
        catalog.toggleAdminLinks(false);
        expect(adminLink.hidden).toBe(true);
        catalog.toggleAdminLinks(true);
        expect(adminLink.hidden).toBe(false);

        const modal = document.getElementById("modal");
        catalog.openAdminModal(modal);
        expect(modal.classList.contains("hidden")).toBe(false);
        expect(modal.getAttribute("aria-hidden")).toBe("false");
        catalog.closeAdminModal(modal);
        expect(modal.classList.contains("hidden")).toBe(true);
        expect(modal.getAttribute("aria-hidden")).toBe("true");

        catalog.bindLogoutAction();
        catalog.bindLogoutAction();
        expect(document.querySelector("[data-action='logout']").dataset.logoutBound).toBe("true");
    });

    test("admin helpers filter, sort and render table rows", () => {
        const movies = [
            { id: 1, title: "Blade Runner", genre: "Sci-Fi", year: 1982, duration: 117, synopsis: "Noir future" },
            { id: 2, title: "Arrival", genre: "Drama", year: 2016, duration: 116, synopsis: "Language contact" },
            { id: 3, title: "Heat", genre: "Crime", year: 1995, duration: 170, synopsis: "Los Angeles", posterUrl: "https://poster.example/heat.jpg" }
        ];
        const tableBody = document.createElement("tbody");

        expect(catalog.applyAdminFilters(movies, { query: "future", genre: "all", year: "" }))
            .toHaveLength(1);
        expect(catalog.applyAdminFilters(movies, { query: "", genre: "Drama", year: "2016" })[0].title)
            .toBe("Arrival");
        expect(catalog.sortMovies(movies, "newest")[0].title).toBe("Arrival");
        expect(catalog.sortMovies(movies, "oldest")[0].title).toBe("Blade Runner");
        expect(catalog.sortMovies(movies, "genre")[0].title).toBe("Heat");
        expect(catalog.sortMovies(movies, "duration")[0].title).toBe("Heat");
        expect(catalog.sortMovies(movies, "unknown")[0].title).toBe("Arrival");
        expect(catalog.sortMovies([
            { title: "B", year: 2000, genre: "Drama", duration: 100 },
            { title: "A", year: 2000, genre: "Drama", duration: 100 }
        ], "newest")[0].title).toBe("A");
        expect(catalog.sortMovies([
            { title: "B", year: 2000, genre: "Drama", duration: 100 },
            { title: "A", year: 2000, genre: "Drama", duration: 100 }
        ], "oldest")[0].title).toBe("A");
        expect(catalog.sortMovies([
            { title: "B", genre: "Drama", duration: 100 },
            { title: "A", genre: "Drama", duration: 100 }
        ], "genre")[0].title).toBe("A");
        expect(catalog.sortMovies([
            { title: "B", duration: 100 },
            { title: "A", duration: 100 }
        ], "duration")[0].title).toBe("A");
        expect(catalog.sortMovies(movies, "")[0].title).toBe("Arrival");

        catalog.renderAdminTable(tableBody, movies, true);
        expect(tableBody.querySelectorAll("tr")).toHaveLength(3);
        expect(tableBody.querySelector("[data-action='edit']")).not.toBeNull();
        expect(tableBody.querySelector("[data-action='delete']")).not.toBeNull();

        catalog.renderAdminTable(tableBody, movies, false);
        expect(tableBody.querySelector("[data-action='edit']")).toBeNull();
        expect(tableBody.querySelector("img").src).toContain("https://poster.example/heat.jpg");

        catalog.renderAdminTable(tableBody, [], true);
        expect(tableBody.textContent).toContain("No movies found");
    });

    test("admin stats and pagination tolerate missing optional DOM", () => {
        document.body.innerHTML = "";
        expect(() => catalog.renderAdminStats([movie(1)])).not.toThrow();
        expect(() => catalog.renderAdminPagination({ page: 5, pageSize: 8 }, 0)).not.toThrow();

        document.body.innerHTML = `
            <strong id="admin-total"></strong>
            <strong id="admin-genres"></strong>
            <strong id="admin-latest"></strong>
            <strong id="admin-average-duration"></strong>
            <span id="admin-range"></span>
            <button id="admin-prev"></button>
            <button id="admin-next"></button>
            <div id="admin-page-list"></div>
        `;

        const state = { page: 99, pageSize: 2 };
        catalog.renderAdminStats([]);
        expect(document.getElementById("admin-latest").textContent).toBe("N/A");
        expect(document.getElementById("admin-average-duration").textContent).toBe("N/A");

        catalog.renderAdminPagination(state, 5);
        expect(state.page).toBe(3);
        expect(document.getElementById("admin-range").textContent).toContain("Showing 5 to 5 of 5");
        expect(document.querySelectorAll("#admin-page-list button")).toHaveLength(3);

        catalog.renderAdminPagination(state, 0);
        expect(document.getElementById("admin-range").textContent).toBe("No entries");
    });

    test("admin dashboard blocks non-admin sessions without loading movies", async () => {
        setupAdminDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({ username: "user", role: "USER" }));
        global.fetch = jest.fn();

        await catalog.initCatalog();
        await settle();

        expect(global.fetch).not.toHaveBeenCalled();
        expect(document.getElementById("catalog-message").textContent).toContain("Admin role required");
        expect(document.getElementById("admin-table-body").textContent).toContain("Admin access required");
    });

    test("catalog grid reloads from filters and reports fetch failures", async () => {
        setupCatalogDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({ username: "viewer", role: "USER" }));

        const calls = [];
        global.fetch = jest.fn(async (input) => {
            const target = new URL(input, "http://127.0.0.1");
            calls.push(`${target.pathname}${target.search}`);

            if (target.search.includes("year=broken")) {
                throw new Error("Catalog down");
            }

            return jsonResponse(200, [movie(7, { title: "Filtered Movie", genre: "Drama", year: 2007 })]);
        });

        await catalog.initCatalog();
        await settle();

        expect(document.getElementById("go-admin-dashboard").hidden).toBe(true);
        expect(document.getElementById("admin-panel").hidden).toBe(true);
        expect(document.getElementById("catalog-grid").textContent).toContain("Filtered Movie");

        const titleInput = document.getElementById("title");
        titleInput.value = "arrival";
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();

        const genreInput = document.getElementById("genre");
        genreInput.value = "Drama";
        genreInput.dispatchEvent(new Event("change", { bubbles: true }));
        await settle();

        const yearInput = document.getElementById("year");
        yearInput.value = "broken";
        yearInput.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();

        expect(calls).toContain("/api/movies?query=arrival");
        expect(calls).toContain("/api/movies?query=arrival&genre=Drama");
        expect(calls).toContain("/api/movies?query=arrival&genre=Drama&year=broken");
        expect(document.getElementById("catalog-message").textContent).toContain("Catalog down");
    });

    test("catalog inline admin handles missing selections and server failures", async () => {
        setupCatalogDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({ username: "admin", role: "ADMIN" }));

        const movies = [movie(1, { title: "Editable Movie", genre: "Drama", year: 2020 })];
        global.fetch = jest.fn(async (input, options = {}) => {
            const method = (options.method || "GET").toUpperCase();
            const target = new URL(input, "http://127.0.0.1");

            if (method === "GET" && target.pathname === "/api/movies") {
                return jsonResponse(200, movies);
            }

            if (method === "PUT" && target.pathname === "/api/movies/1") {
                return textResponse(500, "Update failed");
            }

            if (method === "DELETE" && target.pathname === "/api/movies/1") {
                return textResponse(500, "Delete failed");
            }

            return textResponse(404, "Not found");
        });

        await catalog.initCatalog();
        await settle();

        const grid = document.getElementById("catalog-grid");
        expect(document.getElementById("go-admin-dashboard").hidden).toBe(false);
        expect(document.getElementById("admin-panel").hidden).toBe(false);

        grid.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        const missingButton = document.createElement("button");
        missingButton.dataset.action = "edit";
        missingButton.dataset.movieId = "999";
        grid.append(missingButton);
        missingButton.click();
        expect(document.getElementById("admin-message").textContent).toContain("Movie not found");

        const form = document.getElementById("admin-form");
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        expect(document.getElementById("admin-message").textContent).toContain("Select a movie to edit");

        document.querySelector("[data-action='edit'][data-movie-id='1']").click();
        document.getElementById("admin-title").value = "Changed Movie";
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await settle();
        expect(document.getElementById("admin-message").textContent).toContain("Update failed");

        document.querySelector("[data-action='delete'][data-movie-id='1']").click();
        await settle();
        expect(document.getElementById("admin-message").textContent).toContain("Delete failed");

        document.getElementById("admin-clear").click();
        expect(document.getElementById("admin-title").value).toBe("");
        expect(document.getElementById("admin-message").textContent).toBe("");
    });

    test("admin dashboard supports filtering, create, update and delete", async () => {
        setupAdminDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({ username: "admin", role: "ADMIN" }));

        const calls = [];
        let nextId = 3;
        let movies = [
            {
                id: 1,
                title: "Blade Runner",
                genre: "Sci-Fi",
                year: 1982,
                duration: 117,
                synopsis: "Noir future",
                posterUrl: ""
            },
            {
                id: 2,
                title: "Arrival",
                genre: "Drama",
                year: 2016,
                duration: 116,
                synopsis: "Language contact",
                posterUrl: ""
            }
        ];

        global.fetch = jest.fn(async (input, options = {}) => {
            const method = (options.method || "GET").toUpperCase();
            const target = new URL(input, "http://127.0.0.1");
            const body = options.body ? JSON.parse(options.body) : null;

            calls.push({
                method,
                path: target.pathname,
                body,
                headers: options.headers || {}
            });

            if (method === "GET" && target.pathname === "/api/movies") {
                return jsonResponse(200, movies);
            }

            if (method === "POST" && target.pathname === "/api/movies") {
                const saved = { id: nextId, ...body };
                nextId += 1;
                movies = [...movies, saved];
                return jsonResponse(200, saved);
            }

            if (method === "PUT" && target.pathname === "/api/movies/1") {
                movies = movies.map((movie) => movie.id === 1 ? { ...movie, ...body } : movie);
                return jsonResponse(200, movies.find((movie) => movie.id === 1));
            }

            if (method === "DELETE" && target.pathname === "/api/movies/2") {
                movies = movies.filter((movie) => movie.id !== 2);
                return textResponse(204, "");
            }

            return textResponse(404, "Not found");
        });

        await catalog.initCatalog();
        await settle();

        expect(document.getElementById("admin-total").textContent).toBe("2");
        expect(document.getElementById("admin-table-body").textContent).toContain("Arrival");

        const search = document.getElementById("admin-search");
        search.value = "blade";
        search.dispatchEvent(new Event("input", { bubbles: true }));
        expect(document.getElementById("admin-table-body").textContent).toContain("Blade Runner");
        expect(document.getElementById("admin-table-body").textContent).not.toContain("Arrival");
        expect(document.getElementById("admin-top-search").value).toBe("blade");

        document.getElementById("admin-clear-filters").click();
        document.querySelector("[data-admin-create]").click();
        document.getElementById("admin-title").value = "Heat";
        document.getElementById("admin-year").value = "1995";
        document.getElementById("admin-genre").value = "Crime";
        document.getElementById("admin-duration").value = "170";
        document.getElementById("admin-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await settle();

        document.querySelector("[data-action='edit'][data-movie-id='1']").click();
        document.getElementById("admin-title").value = "Blade Runner Final Cut";
        document.getElementById("admin-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await settle();

        document.querySelector("[data-action='delete'][data-movie-id='2']").click();
        await settle();

        expect(calls.some((entry) => entry.method === "POST" && entry.path === "/api/movies")).toBe(true);
        expect(calls.some((entry) => entry.method === "PUT" && entry.path === "/api/movies/1")).toBe(true);
        expect(calls.some((entry) => entry.method === "DELETE" && entry.path === "/api/movies/2")).toBe(true);
        expect(calls.some((entry) => entry.headers["X-User-Role"] === "ADMIN")).toBe(true);
        expect(document.getElementById("catalog-message").textContent).toContain("Deleted Arrival");
    });

    test("admin dashboard covers pagination, modal controls and remote errors", async () => {
        setupAdminDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({ username: "admin", role: "ADMIN" }));

        let movies = Array.from({ length: 10 }, (_, index) => movie(index + 1, {
            title: index === 0 ? "First Movie" : `Movie ${index + 1}`,
            genre: index === 0 ? "Noir" : (index % 2 === 0 ? "Drama" : "Sci-Fi"),
            posterUrl: index === 0 ? "https://poster.example/first.jpg" : ""
        }));

        global.fetch = jest.fn(async (input, options = {}) => {
            const method = (options.method || "GET").toUpperCase();
            const target = new URL(input, "http://127.0.0.1");

            if (method === "GET" && target.pathname === "/api/movies") {
                return jsonResponse(200, movies);
            }

            if (method === "DELETE") {
                return textResponse(500, "Delete failed");
            }

            if (method === "POST") {
                return textResponse(500, "Create failed");
            }

            return textResponse(404, "Not found");
        });

        await catalog.initCatalog();
        await settle();

        expect(document.getElementById("admin-range").textContent).toContain("Showing 1 to 8 of 10");
        expect(document.getElementById("admin-average-duration").textContent).toMatch(/\dm/);

        document.getElementById("admin-next").click();
        expect(document.getElementById("admin-range").textContent).toContain("Showing 9 to 10 of 10");
        document.getElementById("admin-prev").click();
        document.querySelector("#admin-page-list [data-page='2']").click();
        document.getElementById("admin-page-list").dispatchEvent(new MouseEvent("click", { bubbles: true }));

        const genreFilter = document.getElementById("admin-genre-filter");
        genreFilter.value = "Noir";
        genreFilter.dispatchEvent(new Event("change", { bubbles: true }));
        expect(document.getElementById("admin-table-body").textContent).toContain("First Movie");

        const yearFilter = document.getElementById("admin-year-filter");
        yearFilter.value = "2001";
        yearFilter.dispatchEvent(new Event("input", { bubbles: true }));

        const sortSelect = document.getElementById("admin-sort");
        sortSelect.value = "duration";
        sortSelect.dispatchEvent(new Event("change", { bubbles: true }));

        document.querySelector("[data-admin-create]").click();
        expect(document.getElementById("admin-modal").classList.contains("hidden")).toBe(false);

        const posterUrl = document.getElementById("admin-poster-url");
        posterUrl.value = "https://poster.example/new.jpg";
        posterUrl.dispatchEvent(new Event("input", { bubbles: true }));
        expect(document.getElementById("admin-poster-preview").hidden).toBe(false);
        document.getElementById("admin-poster-preview").dispatchEvent(new Event("error"));
        expect(document.getElementById("admin-poster-placeholder").hidden).toBe(false);

        document.getElementById("admin-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        expect(document.getElementById("admin-message").textContent).toContain("Complete the required movie fields");

        document.getElementById("admin-title").value = "Broken Create";
        document.getElementById("admin-year").value = "2024";
        document.getElementById("admin-genre").value = "Drama";
        document.getElementById("admin-duration").value = "100";
        document.getElementById("admin-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await settle();
        expect(document.getElementById("admin-message").textContent).toContain("Create failed");

        document.getElementById("admin-cancel").click();
        expect(document.getElementById("admin-modal").classList.contains("hidden")).toBe(true);
        document.querySelector("[data-admin-create]").click();
        document.getElementById("admin-close").click();
        document.querySelector("[data-admin-create]").click();
        document.getElementById("admin-overlay").click();
        document.querySelector("[data-admin-create]").click();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        expect(document.getElementById("admin-modal").classList.contains("hidden")).toBe(true);

        document.getElementById("admin-clear-filters").click();
        document.getElementById("admin-table-body").dispatchEvent(new MouseEvent("click", { bubbles: true }));

        document.querySelector("[data-action='edit'][data-movie-id='1']").click();
        document.getElementById("admin-title").value = "Temporary edit";
        document.getElementById("admin-clear").click();
        expect(document.getElementById("admin-title").value).toBe("First Movie");
        document.getElementById("admin-close").click();

        document.querySelector("[data-admin-create]").click();
        document.getElementById("admin-title").value = "Temporary create";
        document.getElementById("admin-clear").click();
        expect(document.getElementById("admin-title").value).toBe("");
        document.getElementById("admin-close").click();

        const missingButton = document.createElement("button");
        missingButton.dataset.action = "edit";
        missingButton.dataset.movieId = "999";
        document.getElementById("admin-table-body").append(missingButton);
        missingButton.click();
        expect(document.getElementById("catalog-message").textContent).toContain("Movie not found");

        document.querySelector("[data-action='delete'][data-movie-id='1']").click();
        await settle();
        expect(document.getElementById("catalog-message").textContent).toContain("Delete failed");
    });

    test("admin dashboard handles initial fetch failures and missing payload branches", async () => {
        setupAdminDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({ username: "admin", role: "ADMIN" }));
        global.fetch = jest.fn().mockRejectedValue(new Error("Network down"));

        await catalog.initCatalog();
        await settle();

        expect(document.getElementById("catalog-message").textContent).toContain("Network down");

        const form = document.getElementById("admin-form");
        form.checkValidity = () => true;
        document.querySelector("[data-admin-create]").click();
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

        expect(document.getElementById("admin-message").textContent).toContain("Title, genre, year, and duration");
    });

    test("initCatalog performs remote calls for load, update and delete", async () => {
        setupCatalogDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({ username: "admin", role: "ADMIN" }));

        const calls = [];
        let movies = [{
            id: 1,
            title: "Old Movie",
            genre: "Drama",
            year: 1999,
            duration: 90,
            synopsis: "Original",
            posterUrl: ""
        }];

        const server = http.createServer((req, res) => {
            const url = new URL(req.url, "http://127.0.0.1");

            if (req.method === "GET" && url.pathname === "/api/movies") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(movies));
                return;
            }

            if (req.method === "PUT" && url.pathname === "/api/movies/1") {
                let body = "";
                req.on("data", (chunk) => {
                    body += chunk;
                });
                req.on("end", () => {
                    const incoming = JSON.parse(body);
                    movies = [{ ...movies[0], ...incoming }];
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify(movies[0]));
                });
                return;
            }

            if (req.method === "DELETE" && url.pathname === "/api/movies/1") {
                movies = [];
                res.writeHead(204, { "Content-Type": "text/plain" });
                res.end("");
                return;
            }

            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("Not found");
        });

        await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
        const address = server.address();
        const baseUrl = `http://127.0.0.1:${address.port}`;

        global.fetch = createHttpFetch(baseUrl, calls);

        await catalog.initCatalog();
        await settle();

        expect(document.querySelectorAll(".movie-card").length).toBeGreaterThan(0);

        document.querySelector("[data-action='edit']").click();
        document.getElementById("admin-title").value = "Updated Movie";
        document.getElementById("admin-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        await settle();

        document.querySelector("[data-action='delete']").click();
        await settle();

        expect(calls.some((entry) => entry.method === "GET" && entry.path.startsWith("/api/movies"))).toBe(true);
        expect(calls.some((entry) => entry.method === "PUT" && entry.path === "/api/movies/1")).toBe(true);
        expect(calls.some((entry) => entry.method === "DELETE" && entry.path === "/api/movies/1")).toBe(true);

        await new Promise((resolve) => server.close(resolve));
    });
});
