# ==============================================================================
# Multi-stage Dockerfile for PaperlessFamily Backend (Spring Boot 3.2 / Java 17)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Application
# ------------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS builder

LABEL stage="builder"
LABEL maintainer="PaperlessFamily DevOps Team"

WORKDIR /build

# Copy Maven dependency descriptor first to leverage Docker layer caching
COPY pom.xml .

# Download dependencies in offline mode
RUN mvn dependency:go-offline -B

# Copy application source code
COPY src ./src

# Build production jar skipping unit tests
RUN mvn clean package -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runtime

LABEL maintainer="PaperlessFamily DevOps Team"
LABEL app="paperlessfamily-backend"
LABEL description="Production runtime container for PaperlessFamily Spring Boot backend"

# Create application user for security (non-root)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Create upload directory and set ownership
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy packaged jar from build stage
COPY --from=builder --chown=appuser:appgroup /build/target/paperlessfamily-*.jar /app/app.jar

# Switch to non-root user
USER appuser

# Expose backend application port
EXPOSE 8080

# Configure JVM options and entry point
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
