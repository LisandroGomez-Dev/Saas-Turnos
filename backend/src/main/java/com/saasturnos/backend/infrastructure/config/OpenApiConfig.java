package com.saasturnos.backend.infrastructure.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de OpenAPI 3 / Swagger UI para explorar y probar los endpoints REST en vivo.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("SaaS Turnos & Control de Caja API")
                        .version("1.0.0")
                        .description("API REST para reservas de turnos online, liquidación de señas con Mercado Pago (webhooks HMAC-SHA256 idempotentes), control de concurrencia con @Version y métricas de caja.")
                        .contact(new Contact()
                                .name("Lisandro Gómez")
                                .url("https://github.com/LisandroGomez-Dev/Saas-Turnos")));
    }
}
