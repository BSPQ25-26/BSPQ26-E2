# Build stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
COPY . .
RUN mvn clean install -DskipTests

# Run stage
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /target/MovieTrakk-1.0-SNAPSHOT.jar app.jar

EXPOSE 8080

# Render provides the PORT environment variable automatically
ENTRYPOINT ["java", "-jar", "app.jar", "--server.port=${PORT}"]