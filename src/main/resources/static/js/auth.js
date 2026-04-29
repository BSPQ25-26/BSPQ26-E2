const AUTH_ENDPOINTS = {
    register: "/api/auth/register",
    login: "/api/auth/login"
};

const USER_HOME_URL = "/catalog.html";
const ADMIN_HOME_URL = "/admin-dashboard.html";
const AUTH_SESSION_KEY = "movieTrakk.session";
const LEGACY_AUTH_SESSION_KEY = "movieTracker.session";
const USER_ID_STORAGE_KEY = "movieTrakk.userId";

function setMessage(element, text, isSuccess) {
    element.textContent = text;
    element.classList.remove("error", "success");
    if (text) {
        element.classList.add(isSuccess ? "success" : "error");
    }
}

async function postJson(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const contentType = response.headers.get("content-type") || "";
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

function saveSession(userId, username, role) {
    try {
        sessionStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
        sessionStorage.setItem(
            AUTH_SESSION_KEY,
            JSON.stringify({
                userId,
                username,
                role: role || "USER",
                loggedInAt: new Date().toISOString()
            })
        );
        if (userId) {
            localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
        }
    } catch (_) {}
}

function resolveLoginRedirect(role) {
    if (typeof role === "string" && role.trim().toUpperCase() === "ADMIN") {
        return ADMIN_HOME_URL;
    }
    return USER_HOME_URL;
}

function bindRegisterForm() {
    const form = document.getElementById("register-form");
    if (!form) {
        return;
    }

    const message = document.getElementById("register-message");
    const button = form.querySelector("button");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
            username: formData.get("username")?.toString().trim(),
            email: formData.get("email")?.toString().trim(),
            password: formData.get("password")?.toString()
        };

        button.disabled = true;
        setMessage(message, "Creating account...", true);

        try {
            const responseText = await postJson(AUTH_ENDPOINTS.register, payload);
            setMessage(message, responseText, true);
            form.reset();
        } catch (error) {
            setMessage(message, error.message, false);
        } finally {
            button.disabled = false;
        }
    });
}

function bindLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) {
        return;
    }

    const message = document.getElementById("login-message");
    const button = form.querySelector("button");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = {
            username: formData.get("username")?.toString().trim(),
            password: formData.get("password")?.toString()
        };

        button.disabled = true;
        setMessage(message, "Signing in...", true);

        try {
            const responseData = await postJson(AUTH_ENDPOINTS.login, payload);
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
            window.location.assign(redirectUrl);
        } catch (error) {
            setMessage(message, error.message, false);
        } finally {
            button.disabled = false;
        }
    });
}

bindRegisterForm();
bindLoginForm();
