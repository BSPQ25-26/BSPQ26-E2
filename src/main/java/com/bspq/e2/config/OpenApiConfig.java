package com.bspq.e2.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI movieTrakkOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MovieTrakk API")
                        .version("1.0-SNAPSHOT")
                        .description("REST API for authentication, catalog management, personal movie lists, notes, recommendations and user stats.")
                        .contact(new Contact()
                                .name("BSPQ26-E2")
                                .url("https://github.com/BSPQ25-26/BSPQ26-E2"))
                        .license(new License()
                                .name("Project repository")
                                .url("https://github.com/BSPQ25-26/BSPQ26-E2")))
                .addServersItem(new Server()
                        .url("http://localhost:8080")
                        .description("Local development server"));
    }
}
