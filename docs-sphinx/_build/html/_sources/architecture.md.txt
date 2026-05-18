# Architecture

MovieTrakk is structured as a Spring Boot application with the following layers:

- **Backend**: Java 21, Spring Boot 3.2.5, Spring Security, Spring Data JPA
- **Database**: PostgreSQL runtime; H2 is used in local profiling flows
- **Frontend**: static HTML/CSS/JavaScript served from `src/main/resources/static`
- **Build**: Maven with frontend support via `frontend-maven-plugin`
- **Testing**: JUnit, Mockito, AssertJ, Jest, JaCoCo, ContiPerf

## Project Structure

```text
src/
  main/
    java/com/bspq/e2/          # Spring Boot application code
    resources/
      static/                  # frontend static assets
      application.properties
  test/
    java/com/bspq/e2/          # backend tests
```

## Key Features

- authentication and role-based security
- REST controllers for movies and user movie status
- persistent data through JPA repositories
- API docs via Springdoc OpenAPI
