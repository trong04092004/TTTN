FROM gradle:8.5-jdk17-alpine AS builder

WORKDIR /app

# Copy gradle related files first for caching
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Copy source code
COPY src src

# Build the project, skip tests for faster build
RUN gradle build -x test

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]
