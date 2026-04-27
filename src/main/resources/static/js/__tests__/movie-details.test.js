window.__MOVIE_DETAILS_DISABLE_AUTO_INIT__ = true;
const details = require("../movie-details.js");

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

function setupDom() {
    document.body.innerHTML = `
        <div id="movie-content" style="display: none;">
            <img id="movie-backdrop" />
            <img id="movie-poster" />
            <h1 id="movie-title"></h1>
            <span id="movie-genre"></span>
            <span id="movie-year"></span>
            <span id="movie-duration"></span>
            <p id="movie-synopsis"></p>
            <div id="user-actions-bar" style="display: none;">
                <button id="btn-watch-later"></button>
                <button id="btn-watched"></button>
                <button id="btn-like"></button>
                <button id="btn-dislike"></button>
            </div>
            <div id="note-section-container" style="display: none;">
                <textarea id="user-note"></textarea>
                <button id="btn-save-note">Save Notes</button>
            </div>
        </div>
        <div id="loading-state" style="display: block;"></div>
        <div id="error-state" style="display: none;"></div>
        <p id="error-message"></p>
        <div id="toast-container"></div>
        <strong id="session-user">Guest</strong>
        <button id="btn-logout">Logout</button>
    `;
}

describe("movie-details client logic", () => {
    let originalLocation;
    let mockedLocation;

    beforeEach(() => {
        document.body.innerHTML = "";
        sessionStorage.clear();
        jest.restoreAllMocks();
        originalLocation = window.location;
        mockedLocation = {
            assign: jest.fn(),
            search: "",
            href: "http://127.0.0.1/movie-details.html"
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

    test("session and location helpers parse defensive cases", () => {
        expect(details.getSessionInfo({ getItem: () => null })).toBeNull();
        expect(details.getSessionInfo({ getItem: () => "{broken" })).toBeNull();
        expect(details.getMovieId({ search: "?id=99" })).toBe("99");
        expect(details.getMovieId({ search: "" })).toBeNull();
    });

    test("renderMovie, updateStatusButtons and showError update the view", () => {
        setupDom();
        const ui = details.createUi(document);

        details.renderMovie(ui, {
            title: "Arrival",
            genre: "Sci-Fi",
            year: 2016,
            duration: 116,
            synopsis: "Language contact",
            posterUrl: "https://poster.example/arrival.jpg"
        });
        details.updateStatusButtons(ui, {
            watchLater: true,
            watched: false,
            liked: true,
            disliked: false
        });

        expect(document.getElementById("movie-title").textContent).toBe("Arrival");
        expect(document.getElementById("movie-content").style.display).toBe("block");
        expect(document.getElementById("btn-watch-later").classList.contains("active")).toBe(true);
        expect(document.getElementById("btn-like").classList.contains("active")).toBe(true);

        details.showError(ui, "Movie not found.");
        expect(document.getElementById("error-state").style.display).toBe("block");
        expect(document.getElementById("error-message").textContent).toBe("Movie not found.");
    });

    test("toast and session helpers support missing optional elements", () => {
        expect(() => details.showToast(null, "Ignored")).not.toThrow();
        expect(() => details.setSessionUser({ sessionUser: null }, null)).not.toThrow();

        const container = document.createElement("div");
        details.showToast(container, "Saved", "success", (callback) => callback());
        expect(container.childElementCount).toBe(0);
    });

    test("initMovieDetailsPage loads the movie and the current user status", async () => {
        setupDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({
            userId: 7,
            username: "alice",
            role: "USER"
        }));

        const fetchMock = jest.fn(async (url) => {
            if (String(url) === "/api/movies/15") {
                return jsonResponse(200, {
                    title: "Interstellar",
                    genre: "Sci-Fi",
                    year: 2014,
                    duration: 169,
                    synopsis: "Space and time",
                    posterUrl: "https://poster.example/interstellar.jpg"
                });
            }
            if (String(url) === "/api/users/7/movies/15/status") {
                return jsonResponse(200, {
                    watchLater: true,
                    watched: true,
                    liked: true,
                    disliked: false,
                    note: "Favorite Nolan film"
                });
            }
            return textResponse(404, "Missing");
        });

        await details.initMovieDetailsPage(document, { search: "?id=15" }, fetchMock);

        expect(document.getElementById("movie-title").textContent).toBe("Interstellar");
        expect(document.getElementById("user-actions-bar").style.display).toBe("flex");
        expect(document.getElementById("note-section-container").style.display).toBe("block");
        expect(document.getElementById("session-user").textContent).toContain("alice");
        expect(document.getElementById("user-note").value).toBe("Favorite Nolan film");
    });

    test("fetchUserStatus and fetchMovieDetails handle non-ok and generic error branches", async () => {
        setupDom();
        const ui = details.createUi(document);

        await expect(details.fetchUserStatus(
            jest.fn().mockResolvedValue(textResponse(404, "Missing")),
            { userId: 1 },
            "3",
            ui
        )).resolves.toBeNull();
        await expect(details.fetchUserStatus(
            jest.fn().mockRejectedValue(new Error("boom")),
            { userId: 1 },
            "3",
            ui
        )).resolves.toBeNull();

        await expect(details.fetchMovieDetails(
            jest.fn().mockResolvedValue(textResponse(500, "Broken")),
            null,
            "3",
            ui
        )).resolves.toBeNull();
        expect(document.getElementById("error-message").textContent).toBe("Failed to load movie details.");

        await expect(details.fetchMovieDetails(jest.fn(), null, null, ui)).resolves.toBeNull();
        expect(document.getElementById("error-message").textContent).toBe("No movie ID specified.");
    });

    test("toggleStatus and saveNote handle success and failure branches", async () => {
        setupDom();
        const ui = details.createUi(document);
        const session = { userId: 9, username: "alice", role: "USER" };

        const fetchMock = jest.fn()
            .mockResolvedValueOnce(jsonResponse(200, {
                watchLater: true,
                watched: false,
                liked: false,
                disliked: false
            }))
            .mockResolvedValueOnce(textResponse(500, "broken"))
            .mockResolvedValueOnce(jsonResponse(200, {}))
            .mockResolvedValueOnce(textResponse(500, "broken"));

        await expect(details.toggleStatus("watch-later", fetchMock, session, "15", ui)).resolves.toBe(true);
        expect(document.getElementById("btn-watch-later").classList.contains("active")).toBe(true);
        expect(document.getElementById("toast-container").textContent).toContain("Status updated successfully");

        await expect(details.toggleStatus("like", fetchMock, session, "15", ui)).resolves.toBe(false);
        expect(document.getElementById("toast-container").textContent).toContain("Failed to update status");

        document.getElementById("user-note").value = "Great visuals";
        await expect(details.saveNote(fetchMock, session, "15", ui)).resolves.toBe(true);
        expect(fetchMock.mock.calls[2][1].method).toBe("PUT");

        document.getElementById("user-note").value = "";
        await expect(details.saveNote(fetchMock, session, "15", ui)).resolves.toBe(false);
        expect(fetchMock.mock.calls[3][1].method).toBe("DELETE");
    });

    test("toggleStatus, saveNote and init guard against missing session or controls", async () => {
        setupDom();
        const ui = details.createUi(document);

        expect(await details.toggleStatus("watch-later", jest.fn(), null, "15", ui)).toBe(false);
        ui.buttons["watch-later"].remove();
        ui.buttons["watch-later"] = null;
        expect(await details.toggleStatus("watch-later", jest.fn(), { userId: 1 }, "15", ui)).toBe(false);
        expect(await details.saveNote(jest.fn(), null, "15", ui)).toBe(false);

        const errorFetch = jest.fn().mockRejectedValue(new Error("Network down"));
        expect(await details.toggleStatus("like", errorFetch, { userId: 1 }, "15", details.createUi(document))).toBe(false);
        expect(document.getElementById("toast-container").textContent).toContain("Network down");

        document.getElementById("user-note").value = "Retry";
        expect(await details.saveNote(errorFetch, { userId: 1 }, "15", details.createUi(document))).toBe(false);
        expect(document.getElementById("toast-container").textContent).toContain("Network down");
    });

    test("initMovieDetailsPage reports missing movies and logout clears the session", async () => {
        setupDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({
            userId: 7,
            username: "alice",
            role: "USER"
        }));

        const fetchMock = jest.fn().mockResolvedValue(textResponse(404, "Missing"));
        await details.initMovieDetailsPage(document, { search: "?id=88" }, fetchMock);

        expect(document.getElementById("error-message").textContent).toBe("Movie not found.");

        document.getElementById("btn-logout").click();
        expect(sessionStorage.getItem("movieTrakk.session")).toBeNull();
        expect(mockedLocation.assign).toHaveBeenCalledWith("/index.html");
    });

    test("initMovieDetailsPage avoids rebinding the same controls twice", async () => {
        setupDom();
        sessionStorage.setItem("movieTrakk.session", JSON.stringify({
            userId: 1,
            username: "alice",
            role: "USER"
        }));

        const fetchMock = jest.fn()
            .mockResolvedValueOnce(jsonResponse(200, {
                title: "Movie",
                genre: "Drama",
                year: 2024,
                duration: 100,
                synopsis: "Synopsis",
                posterUrl: ""
            }))
            .mockResolvedValueOnce(jsonResponse(200, {
                watchLater: false,
                watched: false,
                liked: false,
                disliked: false
            }))
            .mockResolvedValueOnce(jsonResponse(200, {
                title: "Movie",
                genre: "Drama",
                year: 2024,
                duration: 100,
                synopsis: "Synopsis",
                posterUrl: ""
            }))
            .mockResolvedValueOnce(jsonResponse(200, {
                watchLater: false,
                watched: false,
                liked: false,
                disliked: false
            }));

        await details.initMovieDetailsPage(document, { search: "?id=2" }, fetchMock);
        await details.initMovieDetailsPage(document, { search: "?id=2" }, fetchMock);

        expect(document.getElementById("btn-watch-later").dataset.detailsBound).toBe("true");
        expect(document.getElementById("btn-save-note").dataset.detailsBound).toBe("true");
        expect(document.getElementById("btn-logout").dataset.detailsBound).toBe("true");
    });
});
