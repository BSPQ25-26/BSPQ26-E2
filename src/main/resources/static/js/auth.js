(function (scope) {
    const AUTH_ENDPOINTS = {
        register: "/api/auth/register",
        login: "/api/auth/login"
    };

    const USER_HOME_URL = "/catalog.html";
    const ADMIN_HOME_URL = "/admin-dashboard.html";
    const AUTH_SESSION_KEY = "movieTrakk.session";
    const LEGACY_AUTH_SESSION_KEY = "movieTracker.session";
    const USER_ID_STORAGE_KEY = "movieTrakk.userId";

    function readText(value) {
        return value === undefined || value === null ? "" : String(value).trim();
    }

    function setMessage(element, text, isSuccess) {
        if (!element) {
            return;
        }

        element.textContent = text || "";
        element.classList.remove("error", "success");

        if (text) {
            element.classList.add(isSuccess ? "success" : "error");
        }
    }

    function setButtonDisabled(button, disabled) {
        if (button) {
            button.disabled = disabled;
        }
    }

    async function postJson(url, body, fetchImpl = scope.fetch) {
        const response = await fetchImpl(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const contentType = response.headers && typeof response.headers.get === "function"
            ? (response.headers.get("content-type") || "")
            : "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : await response.text();

        if (!response.ok) {
            const message = typeof data === "string"
                ? data
                : (data.message || "Request failed");
            throw new Error(message || "Request failed");
        }

        return data;
    }

    function saveSession(
        userId,
        username,
        role,
        storage = scope.sessionStorage,
        localStore = scope.localStorage,
        nowProvider = () => new Date().toISOString()
    ) {
        try {
            storage?.removeItem(LEGACY_AUTH_SESSION_KEY);
            storage?.setItem(
                AUTH_SESSION_KEY,
                JSON.stringify({
                    userId,
                    username,
                    role: role || "USER",
                    loggedInAt: nowProvider()
                })
            );
            if (userId) {
                localStore?.setItem(USER_ID_STORAGE_KEY, String(userId));
            }
        } catch (_) {}
    }

    function resolveLoginRedirect(role) {
        if (typeof role === "string" && role.trim().toUpperCase() === "ADMIN") {
            return ADMIN_HOME_URL;
        }
        return USER_HOME_URL;
    }

    function buildRegisterPayload(form) {
        const formData = new FormData(form);
        return {
            username: readText(formData.get("username")),
            email: readText(formData.get("email")),
            password: formData.get("password")?.toString() || ""
        };
    }

    function buildLoginPayload(form) {
        const formData = new FormData(form);
        return {
            username: readText(formData.get("username")),
            password: formData.get("password")?.toString() || ""
        };
    }

    function bindRegisterForm(doc = scope.document, fetchImpl = scope.fetch) {
        const form = doc?.getElementById("register-form");
        if (!form || form.dataset.authBound === "true") {
            return false;
        }

        const message = doc.getElementById("register-message");
        const button = form.querySelector("button");

        form.dataset.authBound = "true";
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const payload = buildRegisterPayload(form);

            setButtonDisabled(button, true);
            setMessage(message, "Creating account...", true);

            try {
                const responseText = await postJson(AUTH_ENDPOINTS.register, payload, fetchImpl);
                setMessage(message, responseText, true);
                form.reset();
            } catch (error) {
                setMessage(message, error.message, false);
            } finally {
                setButtonDisabled(button, false);
            }
        });

        return true;
    }

    function bindLoginForm(doc = scope.document, fetchImpl = scope.fetch) {
        const form = doc?.getElementById("login-form");
        if (!form || form.dataset.authBound === "true") {
            return false;
        }

        const message = doc.getElementById("login-message");
        const button = form.querySelector("button");

        form.dataset.authBound = "true";
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const payload = buildLoginPayload(form);

            setButtonDisabled(button, true);
            setMessage(message, "Signing in...", true);

            try {
                const responseData = await postJson(AUTH_ENDPOINTS.login, payload, fetchImpl);
                const serverMessage = typeof responseData === "string"
                    ? responseData
                    : (responseData.message || "Login successful");
                const sessionUsername = typeof responseData === "object" && responseData.username
                    ? responseData.username
                    : (payload.username || "");
                const sessionUserId = typeof responseData === "object" && responseData.userId
                    ? responseData.userId
                    : null;
                const sessionRole = typeof responseData === "object" && responseData.role
                    ? responseData.role
                    : "USER";
                const redirectUrl = resolveLoginRedirect(sessionRole);

                saveSession(sessionUserId, sessionUsername, sessionRole);
                setMessage(message, `${serverMessage}. Redirecting...`, true);
                scope.window?.location?.assign(redirectUrl);
            } catch (error) {
                setMessage(message, error.message, false);
            } finally {
                setButtonDisabled(button, false);
            }
        });

        return true;
    }

    function initAuthPage(doc = scope.document, fetchImpl = scope.fetch) {
        const registerBound = bindRegisterForm(doc, fetchImpl);
        const loginBound = bindLoginForm(doc, fetchImpl);
        return registerBound || loginBound;
    }

    const exportsObject = {
        AUTH_ENDPOINTS,
        setMessage,
        postJson,
        saveSession,
        resolveLoginRedirect,
        buildRegisterPayload,
        buildLoginPayload,
        bindRegisterForm,
        bindLoginForm,
        initAuthPage
    };

    /* istanbul ignore next */
    if (typeof module !== "undefined" && module.exports) {
        module.exports = exportsObject;
    }

    /* istanbul ignore next */
    if (scope && typeof scope.window !== "undefined") {
        scope.window.MovieAuth = exportsObject;
        /* istanbul ignore next */
        if (!scope.window.__MOVIE_AUTH_DISABLE_AUTO_INIT__) {
            /* istanbul ignore next */
            if (scope.document.readyState === "loading") {
                scope.document.addEventListener("DOMContentLoaded", () => initAuthPage());
            } else {
                initAuthPage();
            }
        }
    }
})(typeof globalThis !== "undefined" ? globalThis : this);
