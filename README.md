# MovieTrakk

A full-stack movie tracking web application built with **Spring Boot** and vanilla **HTML/CSS/JS**. MovieTrakk lets users browse a movie catalog, mark films as watched or watch-later, rate them with likes/dislikes, and keep personal notes — all through a sleek, cinematic UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [API Documentation](#api-documentation)
- [API Reference](#api-reference)
- [Screenshots](#screenshots)
- [License](#license)

---

## Features

| Area | Description |
|------|-------------|
| **User Authentication** | Register and log in with hashed passwords (BCrypt). Role-based access (USER / ADMIN). |
| **Movie Catalog** | Browse all movies with search by title, filtering by genre or year. |
| **Movie Details** | Cinematic detail page with backdrop, poster, synopsis, and metadata. |
| **Personal Lists** | Mark movies as *Watched*, *Watch Later*, *Liked*, or *Disliked*. |
| **Notes** | Attach personal notes (up to 1 000 characters) to any movie. |
| **Admin Dashboard** | Admins can add, edit, and delete movies from the catalog. |
| **Swagger / OpenAPI** | Interactive API docs at `/swagger-ui.html`. |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Java 21, Spring Boot 3.2.5, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL (Supabase-hosted or local) |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Build** | Maven, frontend-maven-plugin (Node 20 + npm) |
| **Testing** | JUnit 5, Mockito, AssertJ, Jest (JS), JaCoCo (≥ 80 % line coverage) |
| **Docs** | SpringDoc OpenAPI 2.5 |

---

## Project Structure

```
BSPQ26-E2/
├── src/
│   ├── main/
│   │   ├── java/com/bspq/e2/
│   │   │   ├── config/          # SecurityConfig
│   │   │   ├── controller/      # AuthController, MovieController, UserMovieStatusController
│   │   │   ├── dto/             # MovieStatusDTO
│   │   │   ├── model/           # User, Movie, UserMovieStatus entities
│   │   │   ├── repository/      # JPA repositories
│   │   │   ├── service/         # UserMovieStatusService
│   │   │   └── App.java         # Spring Boot entry point
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/         # catalog.css, my-lists.css, movie-details.css
│   │       │   ├── js/          # catalog.js, my-lists.js, movie-details.js
│   │       │   ├── index.html           # Login page
│   │       │   ├── register.html        # Registration page
│   │       │   ├── catalog.html         # Movie catalog
│   │       │   ├── movie-details.html   # Individual movie view
│   │       │   ├── my-lists.html        # Personal movie lists
│   │       │   └── admin-dashboard.html # Admin CRUD panel
│   │       └── application.properties
│   └── test/
│       └── java/com/bspq/e2/
│           ├── controller/      # AuthControllerTest, MovieControllerTest, UserMovieStatusControllerTest
│           ├── model/           # MovieTest, UserTest, UserMovieStatusTest
│           └── performance/     # ModelPerformanceTest, UserMovieStatusServicePerformanceTest
├── pom.xml
├── package.json                 # JS test dependencies (Jest)
└── README.md
```

---

## Prerequisites

- **Java 21** (JDK)
- **Maven 3.8+**
- **PostgreSQL** database (or a [Supabase](https://supabase.com/) project)
- **Node.js 20** and **npm 10** are installed automatically by the Maven build via `frontend-maven-plugin`

---

## Configuration

Create a `.env` file in the project root with the following variables:

```env
SUPABASE_DB_URL=jdbc:postgresql://<host>:<port>/<database>
SUPABASE_DB_USER=<your-db-username>
SUPABASE_DB_PASSWORD=<your-db-password>
SERVER_PORT=8080
```

The application uses [spring-dotenv](https://github.com/paulschwarz/spring-dotenv) to automatically load these values.

---

## Running the Application

```bash
# 1. Clone the repository
git clone https://github.com/your-org/BSPQ26-E2.git
cd BSPQ26-E2

# 2. Build and start the server
mvn clean spring-boot:run
```

The app will be available at **http://localhost:8080**.

| Page | URL |
|------|-----|
| Login | `/index.html` |
| Register | `/register.html` |
| Catalog | `/catalog.html` |
| Movie Details | `/movie-details.html?id={id}` |
| My Lists | `/my-lists.html` |
| Admin Dashboard | `/admin-dashboard.html` |
| Swagger UI | `/swagger-ui.html` |

---

## Running Tests

```bash
# Run the full test suite (Java + JavaScript + JaCoCo coverage)
mvn clean test

# Run only performance tests
mvn test -Dgroups=performance

# Run only unit tests (exclude performance)
mvn test -DexcludedGroups=performance
```

### Test Categories

| Category | Files | Description |
|----------|-------|-------------|
| **Controller Tests** | `AuthControllerTest`, `MovieControllerTest`, `UserMovieStatusControllerTest` | MockMvc-based tests for all REST endpoints |
| **Model Tests** | `MovieTest`, `UserTest`, `UserMovieStatusTest` | Domain logic and state-transition validation |
| **Service Tests** | `UserMovieStatusServiceTest` | Business logic with mocked repositories |
| **Performance Tests** | `ModelPerformanceTest`, `UserMovieStatusServicePerformanceTest` | Throughput benchmarks with `@Timeout` constraints |
| **JS Tests** | Jest suite via `npm test` | Frontend JavaScript unit tests |

---

## API Documentation

Interactive API documentation is available via Swagger UI when the application is running:

- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI JSON**: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

---

## API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Authenticate and receive session info |
| `GET`  | `/api/auth/resolve-user?username=` | Resolve user ID from username |

### Movies — `/api/movies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/movies` | List all movies (optional: `?genre=`, `?year=`, `?query=`) |
| `GET` | `/api/movies/{id}` | Get movie details by ID |
| `POST` | `/api/movies` | Add a new movie |
| `PUT` | `/api/movies/{id}` | Update a movie *(Admin only — `X-User-Role: ADMIN` header)* |
| `DELETE` | `/api/movies/{id}` | Delete a movie *(Admin only)* |

### User Movie Status — `/api/users/{userId}/movies`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/{movieId}/status/watch-later` | Save movie for later |
| `DELETE` | `/{movieId}/status/watch-later` | Remove from watch later |
| `GET` | `/watch-later` | Get watch-later list (DTOs) |
| `GET` | `/watch-later/movies` | Get watch-later list (Movies) |
| `POST` | `/{movieId}/status/watched` | Mark as watched |
| `DELETE` | `/{movieId}/status/watched` | Unmark watched |
| `GET` | `/watched` | Get watched list |
| `POST` | `/{movieId}/status/like` | Like a movie |
| `DELETE` | `/{movieId}/status/like` | Remove like |
| `GET` | `/liked` | Get liked list |
| `POST` | `/{movieId}/status/dislike` | Dislike a movie |
| `DELETE` | `/{movieId}/status/dislike` | Remove dislike |
| `GET` | `/disliked` | Get disliked list |
| `GET` | `/{movieId}/status` | Get full status for a movie |
| `PUT` | `/{movieId}/status/note` | Save/update a note |
| `DELETE` | `/{movieId}/status/note` | Clear a note |

---
