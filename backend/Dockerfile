# Etapa 1: Build con Java 21 LTS
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml ./
RUN apk add --no-cache maven && mvn dependency:go-offline -B
COPY src/ ./src/
RUN mvn clean package -DskipTests

# Etapa 2: Runtime ligero y seguro
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=builder /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]

