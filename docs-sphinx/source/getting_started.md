# Getting Started

## Prerequisites

- Java 21
- Maven 3.8+
- A PostgreSQL database or Supabase credentials for the normal profile
- Python 3.12+ to build Sphinx documentation locally

## Running the Application

```bash
mvn clean spring-boot:run
```

If you need a different profile, use:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=profiling
```

## Local Documentation Build

From the project root:

```bash
cd docs-sphinx
pip install -r requirements.txt
make html
```

Open the generated site at `docs-sphinx/_build/html/index.html`.
