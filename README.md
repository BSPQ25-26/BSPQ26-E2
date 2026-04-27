# MovieTrakk

MovieTrakk is a full-stack movie tracking web application built with Spring Boot and vanilla HTML, CSS and JavaScript. Users can browse the catalog, mark films as watched or watch later, save notes and manage personal preferences from a lightweight web client.

## Features

| Area | Description |
|------|-------------|
| **User Authentication** | Register and log in with hashed passwords and role support. |
| **Movie Catalog** | Browse the full catalog and filter by query, genre or year. |
| **Movie Details** | Inspect posters, synopsis and metadata for each movie. |
| **Personal Lists** | Mark movies as watched, watch later, liked or disliked. |
| **Notes** | Save personal notes up to 1000 characters per movie. |
| **Admin Dashboard** | Create, edit and delete movies. |
| **Swagger / OpenAPI** | Interactive API documentation at `/swagger-ui.html`. |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 21, Spring Boot 3.2.5, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL in normal runs, H2 for local profiling and performance runs |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Build** | Maven, frontend-maven-plugin, Node 20, npm 10 |
| **Testing** | JUnit 5, JUnit 4, Mockito, AssertJ, Jest, JaCoCo, ContiPerf |
| **Profiling** | VisualVM 2.2.1 |

## Project Structure

```text
BSPQ26-E2/
|-- scripts/                           # Local automation for tests, ContiPerf and VisualVM
|-- src/
|   |-- main/
|   |   |-- java/com/bspq/e2/          # Spring Boot application
|   |   `-- resources/
|   |       |-- static/                # HTML, CSS and JS client
|   |       |-- application.properties
|   |       |-- application-profiling.properties
|   |       `-- profiling-data.sql
|   `-- test/
|       |-- java/com/bspq/e2/
|       |   |-- controller/
|       |   |-- model/
|       |   `-- performance/
|       `-- resources/
|           `-- application-performance.properties
|-- artifacts/                         # Generated ContiPerf and VisualVM outputs
|-- pom.xml
`-- README.md
```

## Prerequisites

- Java 21
- Maven 3.8+
- PostgreSQL or Supabase only for the normal non-local profile
- No global Node installation is required because Maven installs Node and npm automatically for frontend tests

## Configuration

Create a `.env` file in the project root for the normal application profile:

```env
SUPABASE_DB_URL=jdbc:postgresql://<host>:<port>/<database>
SUPABASE_DB_USER=<your-db-username>
SUPABASE_DB_PASSWORD=<your-db-password>
SERVER_PORT=8080
```

For local profiling and performance scripts no Supabase credentials are needed. Those flows use H2 through the `profiling` and `performance` profiles.

## Running the Application

```bash
# Normal profile
mvn clean spring-boot:run

# Local profiling profile with H2 seed data
mvn spring-boot:run -Dspring-boot.run.profiles=profiling
```

The default application URL is `http://localhost:8080`.

## Running Tests

```bash
# Full Java and JavaScript suite with coverage checks
mvn clean test

# Successful remote performance run with ContiPerf reports
powershell -ExecutionPolicy Bypass -File .\scripts\run-contiperf-success.ps1

# Expected failing remote performance run with ContiPerf reports
powershell -ExecutionPolicy Bypass -File .\scripts\run-contiperf-failure.ps1

# Full local verification flow used in this repository
powershell -ExecutionPolicy Bypass -File .\scripts\verify-local.ps1
```

## Continuous Integration

GitHub Actions runs the mandatory test suite on every push and pull request with:

```bash
mvn -B clean test
```

That command executes the Java/Spring tests, the Jest frontend tests and the configured coverage checks. ContiPerf remains a local/manual verification flow so the required CI check stays fast and stable.

To require passing tests before merging pull requests, enable branch protection in GitHub under `Settings` -> `Branches` -> `Branch protection rules` and require the `Tests / test` status check.

### Test Categories

| Category | Files | Description |
|----------|-------|-------------|
| **Controller Tests** | `AuthControllerTest`, `MovieControllerTest`, `UserMovieStatusControllerTest` | MockMvc tests for REST endpoints |
| **Model Tests** | `MovieTest`, `UserTest`, `UserMovieStatusTest` | Domain behavior and state transitions |
| **Service Tests** | `UserMovieStatusServiceTest` | Business logic with mocked repositories |
| **Remote Performance Tests** | `RemotePerformanceSuccessIT`, `RemotePerformanceFailureIT` | ContiPerf tests over real HTTP calls to the embedded server |
| **JS Tests** | Jest suites for `catalog.js`, `auth.js`, `movie-details.js` and `my-lists.js` | Frontend unit and remoteness coverage |

### Generated Artifacts

- Successful ContiPerf reports are copied to `artifacts/contiperf/success`.
- Expected failing ContiPerf reports are copied to `artifacts/contiperf/failure`.
- VisualVM snapshots are copied to `artifacts/visualvm`.

## Local Profiling with VisualVM

```bash
# Download and configure VisualVM locally
powershell -ExecutionPolicy Bypass -File .\scripts\setup-visualvm.ps1

# Start the server with local H2 data, generate load and save a VisualVM snapshot
powershell -ExecutionPolicy Bypass -File .\scripts\run-visualvm-profile.ps1
```

The profiling script starts the application with the `profiling` profile, launches CPU sampling in VisualVM, generates HTTP traffic against the server and copies the newest generated snapshot into `artifacts/visualvm`.

## API Documentation

- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- OpenAPI JSON: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

## API Reference

### Authentication - `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive session info |
| `GET` | `/api/auth/resolve-user?username=` | Resolve the user id from a username |

### Movies - `/api/movies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/movies` | List all movies or filter with `query`, `genre` or `year` |
| `GET` | `/api/movies/{id}` | Fetch movie details |
| `POST` | `/api/movies` | Create a movie |
| `PUT` | `/api/movies/{id}` | Update a movie with header `X-User-Role: ADMIN` |
| `DELETE` | `/api/movies/{id}` | Delete a movie with header `X-User-Role: ADMIN` |

### User Movie Status - `/api/users/{userId}/movies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/{movieId}/status/watch-later` | Save for later |
| `DELETE` | `/{movieId}/status/watch-later` | Remove from watch later |
| `GET` | `/watch-later` | Get watch-later DTOs |
| `GET` | `/watch-later/movies` | Get watch-later movies |
| `POST` | `/{movieId}/status/watched` | Mark as watched |
| `DELETE` | `/{movieId}/status/watched` | Remove watched flag |
| `GET` | `/watched` | Get watched movies |
| `POST` | `/{movieId}/status/like` | Like a movie |
| `DELETE` | `/{movieId}/status/like` | Remove like |
| `GET` | `/liked` | Get liked movies |
| `POST` | `/{movieId}/status/dislike` | Dislike a movie |
| `DELETE` | `/{movieId}/status/dislike` | Remove dislike |
| `GET` | `/disliked` | Get disliked movies |
| `GET` | `/{movieId}/status` | Get the current status DTO |
| `PUT` | `/{movieId}/status/note` | Save or update a note |
| `DELETE` | `/{movieId}/status/note` | Clear a note |
