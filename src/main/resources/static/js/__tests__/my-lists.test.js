window.__MOVIE_LISTS_DISABLE_AUTO_INIT__ = true;
const myLists = require("../my-lists.js");

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

function movie(id, overrides = {}) {
    return {
        id,
        title: `Movie ${id}`,
        genre: "Drama",
        year: 2000 + id,
        duration: 90 + id,
        synopsis: `Synopsis ${id}`,
        posterUrl: "",
        ...overrides
    };
}

function setupDom() {
    document.body.innerHTML = `
        <strong id="session-user" data-session-user>Guest</strong>
        <button type="button" id="go-admin-dashboard" data-admin-link hidden>Admin</button>
        <button type="button" data-action="logout">Logout</button>
        <button class="tab-button active" data-list-type="watched">Watched</button>
        <button class="tab-button" data-list-type="liked">Liked</button>
        <p id="status-message"></p>
        <section id="catalog-grid"></section>
        <div id="loading" style="display: none;"></div>
    `;
}

async function settle() {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
}

describe("my-lists client logic", () => {
    let originalLocation;
    let mockedLocation;

    beforeEach(() => {
        document.body.innerHTML = "";
        sessionStorage.clear();
        localStorage.clear();
        jest.restoreAllMocks();
        originalLocation = window.location;
        mockedLocation = {
            assign: jest.fn(),
            search: "",
            href: "http://127.0.0.1/my-lists.html"
        };
        delete window.location;
        Object.defineProperty(window, "location", {
            configurable: true,
            value: mockedLocation
        });
    });

    afterEach(() => {
        delete window.location;
        Object.defineProperty(window, "location", {
            configurable: true,
            value: originalLocation
        });
    });

    test("session helpers normalize values and recover legacy sessions", async () => {
        expect(myLists.normalizeUserId("7")).toBe(7);
        expect(myLists.normalizeUserId("0")).toBeNull();
        expect(myLists.getSessionInfo(null)).toBeNull();
        expect(myLists.isAdminSession({ role: "ADMIN" })).toBe(true);
        expect(myLists.isAdminSession({ role: "USER" })).toBe(false);

        localStorage.setItem("movieTrakk.userId", "12");
        const recovered = await myLists.ensureSessionUserId(null);
        expect(recovered).toEqual({
            userId: 12,
            username: "",
            role: "USER"
        });

        const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, {
            userId: 21,
            username: "alice",
            role: "ADMIN"
        }));
        localStorage.clear();
        global.fetch = fetchMock;

        const resolved = await myLists.ensureSessionUserId({
            username: "alice",
            role: "USER"
        });

        expect(resolved.userId).toBe(21);
        expect(resolved.role).toBe("ADMIN");
        expect(fetchMock).toHaveBeenCalledWith("/api/auth/resolve-user?username=alice", undefined);
    });

    test("render helpers support populated and empty states", () => {
        const grid = document.createElement("section");

        myLists.renderMovies(grid, []);
        expect(grid.textContent).toContain("No movies in this list.");

        const card = myLists.createMovieCard(movie(1, {
            title: "",
            genre: "",
            year: 0,
            duration: 0,
            synopsis: "",
            posterUrl: "https://poster.example/a.jpg"
        }));

        expect(card.textContent).toContain("Untitled");
        expect(card.textContent).toContain("Unknown");
        expect(card.textContent).toContain("TBD");
        expect(card.querySelector("img").src).toContain("https://poster.example/a.jpg");
    });

    test("requestJson, status helpers and persistence cover fallback branches", async () => {
        setupDom();

        global.fetch = jest.fn()
            .mockResolvedValueOnce({
                ok: true,
                headers: {
                    get: () => "application/json"
                },
                json: async () => {
                    throw new Error("broken json");
                },
                text: async () => ""
            })
            .mockResolvedValueOnce({
                ok: false,
                headers: null,
                text: async () => "plain error"
            });

        await expect(myLists.requestJson("/plain")).resolves.toBe("");
        await expect(myLists.requestJson("/plain")).rejects.toThrow("plain error");

        expect(() => myLists.setStatus(null, "ignored", true)).not.toThrow();
        myLists.setStatus(document.getElementById("status-message"), "", false);
        expect(document.getElementById("status-message").className).toBe("");

        myLists.persistSession(null);
        myLists.persistSession({ userId: "15", username: "alice", role: "USER" });
        expect(JSON.parse(sessionStorage.getItem("movieTrakk.session")).userId).toBe(15);
        expect(localStorage.getItem("movieTrakk.userId")).toBe("15");
    });

    test("loadMovieList validates sessions and reports remote failures", async () => {
        setupDom();
        global.fetch = jest.fn().mockResolvedValue(textResponse(500, "Server down"));

        await expect(myLists.loadMovieList(null, "watched")).resolves.toEqual([]);
        expect(document.getElementById("status-message").textContent).toContain("Invalid user session");

        await expect(myLists.loadMovieList(5, "liked")).resolves.toEqual([]);
        expect(document.getElementById("status-message").textContent).toContain("Server down");
        expect(document.getElementById("loading").style.display).toBe("none");
    });

    test("ensureSessionUserId and loadAndDisplayList handle missing data branches", async () => {
        setupDom();
        global.fetch = jest.fn().mockRejectedValue(new Error("Network down"));

        expect(await myLists.ensureSessionUserId({ role: "USER" })).toEqual({ role: "USER" });
        expect(await myLists.ensureSessionUserId({ username: "alice", role: "USER" })).toEqual({
            username: "alice",
            role: "USER"
        });

        await myLists.loadAndDisplayList("watched");
        expect(document.getElementById("status-message").textContent).toContain("outdated");

        sessionStorage.setItem("movieTrakk.session", JSON.stringify({
            userId: 4,
            username: "user",
            role: "USER"
        }));
        document.getElementById("catalog-grid").remove();

        await myLists.loadAndDisplayList("watched");
        expect(document.getElementById("status-message").textContent).toContain("Movies area not found");
    });

    test("initPage loads watched list, switches tabs and binds navigation actions", async () => {
        setupDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({
            userId: 4,
            username: "admin",
            role: "ADMIN"
        }));

        const calls = [];
        global.fetch = jest.fn(async (url) => {
            calls.push(url);

            if (String(url).endsWith("/watched")) {
                return jsonResponse(200, [movie(1)]);
            }
            if (String(url).endsWith("/liked")) {
                return jsonResponse(200, [movie(2, { title: "Liked Movie" })]);
            }
            return textResponse(404, "Missing");
        });

        await myLists.initPage();

        expect(document.getElementById("session-user").textContent).toContain("admin");
        expect(document.getElementById("go-admin-dashboard").hidden).toBe(false);
        expect(document.getElementById("catalog-grid").textContent).toContain("Movie 1");

        document.querySelector("[data-list-type='liked']").click();
        await settle();

        expect(document.getElementById("catalog-grid").textContent).toContain("Liked Movie");
        expect(calls).toContain("/api/users/4/movies/watched");
        expect(calls).toContain("/api/users/4/movies/liked");

        document.getElementById("go-admin-dashboard").click();
        expect(mockedLocation.assign).toHaveBeenCalledWith("/admin-dashboard.html");

        document.querySelector("[data-action='logout']").click();
        expect(sessionStorage.getItem("movieTrakk.session")).toBeNull();
        expect(mockedLocation.assign).toHaveBeenCalledWith("/index.html");
    });

    test("tab and navigation binders tolerate duplicates and inert controls", async () => {
        setupDom();
        document.body.insertAdjacentHTML("beforeend", `<button class="tab-button" data-list-type="">Empty</button>`);
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({
            userId: 5,
            username: "user",
            role: "USER"
        }));

        global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, []));

        myLists.bindLogoutAction();
        myLists.bindLogoutAction();
        myLists.bindAdminDashboardAction();
        myLists.bindAdminDashboardAction();
        await myLists.initPage();
        myLists.initPage();

        document.querySelector("[data-list-type='']").click();
        await settle();

        expect(document.querySelector("[data-action='logout']").dataset.logoutBound).toBe("true");
        expect(document.getElementById("go-admin-dashboard").dataset.dashboardBound).toBe("true");
        expect(document.querySelector("[data-list-type='']").dataset.listBound).toBe("true");
    });
});
