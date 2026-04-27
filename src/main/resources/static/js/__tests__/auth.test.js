window.__MOVIE_AUTH_DISABLE_AUTO_INIT__ = true;
const auth = require("../auth.js");

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

async function settle() {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
}

describe("auth client logic", () => {
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
            href: "http://127.0.0.1/index.html"
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

    test("setMessage supports success, error and null elements", () => {
        const message = document.createElement("p");

        expect(() => auth.setMessage(null, "Ignored", true)).not.toThrow();

        auth.setMessage(message, "Saved", true);
        expect(message.textContent).toBe("Saved");
        expect(message.classList.contains("success")).toBe(true);

        auth.setMessage(message, "Failed", false);
        expect(message.classList.contains("error")).toBe(true);

        auth.setMessage(message, "", true);
        expect(message.className).toBe("");
    });

    test("postJson handles json success and text failure", async () => {
        const fetchMock = jest.fn()
            .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
            .mockResolvedValueOnce(textResponse(403, "Denied"));

        await expect(auth.postJson("/api/auth/login", { username: "alice" }, fetchMock))
            .resolves
            .toEqual({ ok: true });

        await expect(auth.postJson("/api/auth/login", { username: "alice" }, fetchMock))
            .rejects
            .toThrow("Denied");
    });

    test("postJson supports json errors and header-less responses", async () => {
        const fetchMock = jest.fn()
            .mockResolvedValueOnce({
                ok: false,
                headers: {
                    get: () => "application/json"
                },
                json: async () => ({ message: "Bad credentials" }),
                text: async () => ""
            })
            .mockResolvedValueOnce({
                ok: true,
                headers: null,
                text: async () => "plain text"
            });

        await expect(auth.postJson("/api/auth/login", {}, fetchMock)).rejects.toThrow("Bad credentials");
        await expect(auth.postJson("/api/auth/login", {}, fetchMock)).resolves.toBe("plain text");
    });

    test("saveSession and redirect helpers persist consistent session data", () => {
        auth.saveSession(7, "alice", "ADMIN", sessionStorage, localStorage, () => "2026-04-27T12:00:00.000Z");

        expect(JSON.parse(sessionStorage.getItem("movieTrakk.session"))).toEqual({
            userId: 7,
            username: "alice",
            role: "ADMIN",
            loggedInAt: "2026-04-27T12:00:00.000Z"
        });
        expect(localStorage.getItem("movieTrakk.userId")).toBe("7");
        expect(auth.resolveLoginRedirect("ADMIN")).toBe("/admin-dashboard.html");
        expect(auth.resolveLoginRedirect("user")).toBe("/catalog.html");
    });

    test("register form submits payload and resets on success", async () => {
        document.body.innerHTML = `
            <form id="register-form">
                <input name="username" />
                <input name="email" />
                <input name="password" />
                <button type="submit">Send</button>
            </form>
            <p id="register-message"></p>
        `;
        document.querySelector("#register-form [name='username']").value = "  alice  ";
        document.querySelector("#register-form [name='email']").value = "  alice@example.com  ";
        document.querySelector("#register-form [name='password']").value = "secret";

        const fetchMock = jest.fn().mockResolvedValue(textResponse(200, "User registered successfully"));

        expect(auth.bindRegisterForm(document, fetchMock)).toBe(true);
        expect(auth.bindRegisterForm(document, fetchMock)).toBe(false);

        document.getElementById("register-form").dispatchEvent(new Event("submit", {
            bubbles: true,
            cancelable: true
        }));
        await settle();

        expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", expect.objectContaining({
            method: "POST"
        }));
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
            username: "alice",
            email: "alice@example.com",
            password: "secret"
        });
        expect(document.getElementById("register-message").textContent).toBe("User registered successfully");
        expect(document.querySelector("#register-form [name='username']").value).toBe("");
    });

    test("payload builders and form guards cover defensive branches", () => {
        document.body.innerHTML = `
            <form id="register-form">
                <input name="username" value=" user " />
                <input name="email" value=" mail@example.com " />
                <input name="password" value="" />
                <button type="submit">Send</button>
            </form>
            <form id="login-form">
                <input name="username" value=" admin " />
                <input name="password" value="" />
                <button type="submit">Send</button>
            </form>
            <p id="register-message"></p>
            <p id="login-message"></p>
        `;

        expect(auth.buildRegisterPayload(document.getElementById("register-form"))).toEqual({
            username: "user",
            email: "mail@example.com",
            password: ""
        });
        expect(auth.buildLoginPayload(document.getElementById("login-form"))).toEqual({
            username: "admin",
            password: ""
        });
        expect(auth.initAuthPage(null, jest.fn())).toBe(false);
        auth.bindLoginForm(document, jest.fn());
        expect(auth.bindLoginForm(document, jest.fn())).toBe(false);
    });

    test("login form saves session and redirects on success", async () => {
        document.body.innerHTML = `
            <form id="login-form">
                <input name="username" value="admin" />
                <input name="password" value="secret" />
                <button type="submit">Send</button>
            </form>
            <p id="login-message"></p>
        `;

        const fetchMock = jest.fn().mockResolvedValue(jsonResponse(200, {
            message: "Login successful",
            userId: 3,
            username: "admin",
            role: "ADMIN"
        }));

        auth.initAuthPage(document, fetchMock);

        document.getElementById("login-form").dispatchEvent(new Event("submit", {
            bubbles: true,
            cancelable: true
        }));
        await settle();

        expect(JSON.parse(sessionStorage.getItem("movieTrakk.session")).role).toBe("ADMIN");
        expect(localStorage.getItem("movieTrakk.userId")).toBe("3");
        expect(document.getElementById("login-message").textContent).toContain("Redirecting");
        expect(mockedLocation.assign).toHaveBeenCalledWith("/admin-dashboard.html");
    });

    test("login form renders server errors and re-enables the button", async () => {
        document.body.innerHTML = `
            <form id="login-form">
                <input name="username" value="admin" />
                <input name="password" value="wrong" />
                <button type="submit">Send</button>
            </form>
            <p id="login-message"></p>
        `;

        const fetchMock = jest.fn().mockResolvedValue(textResponse(401, "Invalid credentials"));
        const button = document.querySelector("#login-form button");

        auth.bindLoginForm(document, fetchMock);
        document.getElementById("login-form").dispatchEvent(new Event("submit", {
            bubbles: true,
            cancelable: true
        }));
        await settle();

        expect(document.getElementById("login-message").textContent).toBe("Invalid credentials");
        expect(button.disabled).toBe(false);
        expect(mockedLocation.assign).not.toHaveBeenCalled();
    });

    test("login form supports plain-text success payloads and default role fallback", async () => {
        document.body.innerHTML = `
            <form id="login-form">
                <input name="username" />
                <input name="password" />
                <button type="submit">Send</button>
            </form>
            <p id="login-message"></p>
        `;
        document.querySelector("#login-form [name='username']").value = "viewer";
        document.querySelector("#login-form [name='password']").value = "secret";

        const fetchMock = jest.fn().mockResolvedValue(textResponse(200, "Welcome"));

        expect(auth.bindLoginForm(null, fetchMock)).toBe(false);
        auth.bindLoginForm(document, fetchMock);
        document.getElementById("login-form").dispatchEvent(new Event("submit", {
            bubbles: true,
            cancelable: true
        }));
        await settle();

        expect(JSON.parse(sessionStorage.getItem("movieTrakk.session"))).toEqual(expect.objectContaining({
            username: "viewer",
            role: "USER",
            userId: null
        }));
        expect(localStorage.getItem("movieTrakk.userId")).toBeNull();
        expect(mockedLocation.assign).toHaveBeenCalledWith("/catalog.html");
    });

    test("register form renders server errors", async () => {
        document.body.innerHTML = `
            <form id="register-form">
                <input name="username" />
                <input name="email" />
                <input name="password" />
                <button type="submit">Send</button>
            </form>
            <p id="register-message"></p>
        `;
        document.querySelector("#register-form [name='username']").value = "alice";
        document.querySelector("#register-form [name='email']").value = "alice@example.com";
        document.querySelector("#register-form [name='password']").value = "secret";

        const fetchMock = jest.fn().mockResolvedValue(textResponse(400, "Username already exists"));

        auth.bindRegisterForm(document, fetchMock);
        document.getElementById("register-form").dispatchEvent(new Event("submit", {
            bubbles: true,
            cancelable: true
        }));
        await settle();

        expect(document.getElementById("register-message").textContent).toBe("Username already exists");
    });
});
