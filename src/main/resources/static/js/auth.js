const AUTH_ENDPOINTS = {
    register: "/api/auth/register",
    login: "/api/auth/login"
};

const LOGIN_REDIRECT_URL = "/catalog.html";
const AUTH_SESSION_KEY = "movieTracker.session";

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

    const data = await response.text();
    if (!response.ok) {
        throw new Error(data || "Request failed");
    }

    return data;
}

function saveSession(username) {
    try {
        sessionStorage.setItem(
            AUTH_SESSION_KEY,
            JSON.stringify({
                username,
                loggedInAt: new Date().toISOString()
            })
        );
    } catch (_) {
        // Storage might be blocked in some browser/privacy modes.
    }
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
            const responseText = await postJson(AUTH_ENDPOINTS.login, payload);
            saveSession(payload.username || "");
            setMessage(message, `${responseText}. Redirecting...`, true);
            window.location.assign(LOGIN_REDIRECT_URL);
        } catch (error) {
            setMessage(message, error.message, false);
        } finally {
            button.disabled = false;
        }
    });
}

bindRegisterForm();
bindLoginForm();
