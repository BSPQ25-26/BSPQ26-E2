const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

window.__MOVIE_CATALOG_DISABLE_AUTO_INIT__ = true;
const catalog = require("../catalog.js");

jest.setTimeout(180000);

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..", "..", "..");
const TARGET_DIR = path.join(PROJECT_ROOT, "target");
const CLASS_OUTPUT = path.join(TARGET_DIR, "classes", "com", "bspq", "e2", "App.class");
const TEST_CLASSPATH_FILE = path.join(TARGET_DIR, "jest-spring.classpath");
const IS_WINDOWS = process.platform === "win32";
const MVN_COMMAND = IS_WINDOWS ? "mvn.cmd" : "mvn";
const JAVA_COMMAND = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, "bin", IS_WINDOWS ? "java.exe" : "java")
    : (IS_WINDOWS ? "java.exe" : "java");

function setupCatalogDom() {
    document.body.innerHTML = `
        <section class="controls">
            <input id="title" />
            <select id="genre">
                <option value="all" selected>All</option>
                <option value="Drama">Drama</option>
                <option value="Sci-Fi">Sci-Fi</option>
                <option value="Thriller">Thriller</option>
            </select>
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

async function waitForCondition(assertion, timeoutMs = 15000, intervalMs = 100) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
        if (assertion()) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error("Timed out waiting for client integration condition.");
}

function runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd,
            env: process.env,
            stdio: ["ignore", "pipe", "pipe"]
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        child.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        child.on("error", reject);
        child.on("exit", (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
                return;
            }

            reject(new Error(
                `${command} ${args.join(" ")} failed with exit code ${code}\n` +
                `STDOUT:\n${stdout}\nSTDERR:\n${stderr}`
            ));
        });
    });
}

function findFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            server.close((closeError) => {
                if (closeError) {
                    reject(closeError);
                    return;
                }
                resolve(address.port);
            });
        });
    });
}

async function ensureBackendArtifacts() {
    if (!fs.existsSync(CLASS_OUTPUT)) {
        await runCommand(MVN_COMMAND, ["-q", "-DskipTests", "test-compile"], PROJECT_ROOT);
    }

    await runCommand(
        MVN_COMMAND,
        ["-q", "-DincludeScope=test", `-Dmdep.outputFile=${TEST_CLASSPATH_FILE}`, "dependency:build-classpath"],
        PROJECT_ROOT
    );
}

function formatClasspath() {
    const dependencyClasspath = fs.readFileSync(TEST_CLASSPATH_FILE, "utf8").trim();
    return [
        path.join(TARGET_DIR, "classes"),
        path.join(TARGET_DIR, "test-classes"),
        dependencyClasspath
    ].filter(Boolean).join(path.delimiter);
}

function buildStartupError(message, stdout, stderr) {
    return new Error(`${message}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
}

async function waitForServerReady(port, child, output, timeoutMs = 90000) {
    const startedAt = Date.now();
    const probeUrl = `http://127.0.0.1:${port}/api/movies`;

    while (Date.now() - startedAt < timeoutMs) {
        if (child.exitCode !== null) {
            throw buildStartupError("Spring Boot server exited before becoming ready.", output.stdout, output.stderr);
        }

        try {
            await createHttpFetch(`http://127.0.0.1:${port}`, [])(probeUrl);
            return;
        } catch (_) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    throw buildStartupError(`Timed out waiting for Spring Boot server on port ${port}.`, output.stdout, output.stderr);
}

async function startRealBackend() {
    await ensureBackendArtifacts();

    const port = await findFreePort();
    const classpath = formatClasspath();
    const output = {
        stdout: "",
        stderr: ""
    };

    const child = spawn(
        JAVA_COMMAND,
        [
            "-cp",
            classpath,
            "com.bspq.e2.App",
            "--spring.profiles.active=performance",
            `--server.port=${port}`
        ],
        {
            cwd: PROJECT_ROOT,
            env: process.env,
            stdio: ["ignore", "pipe", "pipe"]
        }
    );

    child.stdout.on("data", (chunk) => {
        output.stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
        output.stderr += chunk.toString();
    });

    child.on("error", (error) => {
        output.stderr += `${error}\n`;
    });

    await waitForServerReady(port, child, output);
    return { child, port, output };
}

async function stopRealBackend(serverHandle) {
    if (!serverHandle || !serverHandle.child || serverHandle.child.exitCode !== null) {
        return;
    }

    if (IS_WINDOWS) {
        try {
            await runCommand("taskkill", ["/pid", String(serverHandle.child.pid), "/t", "/f"], PROJECT_ROOT);
        } catch (_) {
            serverHandle.child.kill();
        }
        return;
    }

    serverHandle.child.kill("SIGTERM");

    await new Promise((resolve) => {
        const timeout = setTimeout(() => {
            serverHandle.child.kill("SIGKILL");
            resolve();
        }, 5000);

        serverHandle.child.once("exit", () => {
            clearTimeout(timeout);
            resolve();
        });
    });
}

describe("catalog client integration with the real Spring Boot server", () => {
    let backend;

    beforeAll(async () => {
        backend = await startRealBackend();
    });

    afterAll(async () => {
        await stopRealBackend(backend);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        sessionStorage.clear();
        document.body.innerHTML = "";
        document.body.className = "";
        delete global.fetch;
    });

    test("initCatalog loads and filters catalog data from the project backend", async () => {
        setupCatalogDom();

        const calls = [];
        global.fetch = createHttpFetch(`http://127.0.0.1:${backend.port}`, calls);

        await catalog.initCatalog();
        await settle();

        const grid = document.getElementById("catalog-grid");
        expect(grid.textContent).toContain("Performance Runner");
        expect(grid.textContent).toContain("Profiling Session");
        expect(grid.textContent).toContain("Load Check");
        expect(calls.some((entry) => entry.method === "GET" && entry.path === "/api/movies")).toBe(true);

        const titleInput = document.getElementById("title");
        titleInput.value = "Profiling";
        titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        await waitForCondition(() =>
            grid.textContent.includes("Profiling Session") &&
            !grid.textContent.includes("Performance Runner") &&
            calls.some((entry) => entry.path === "/api/movies?query=Profiling")
        );

        expect(grid.textContent).toContain("Profiling Session");
        expect(grid.textContent).not.toContain("Performance Runner");
        expect(calls.some((entry) => entry.path === "/api/movies?query=Profiling")).toBe(true);
    });
});
