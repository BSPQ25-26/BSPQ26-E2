package com.bspq.e2.config;

import io.swagger.v3.oas.models.OpenAPI;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenApiConfigTest {

    @Test
    void movieTrakkOpenAPI_describesPublicApi() {
        OpenAPI openAPI = new OpenApiConfig().movieTrakkOpenAPI();

        assertThat(openAPI.getInfo().getTitle()).isEqualTo("MovieTrakk API");
        assertThat(openAPI.getInfo().getDescription()).contains("authentication", "catalog", "user stats");
        assertThat(openAPI.getServers()).extracting("url").contains("http://localhost:8080");
    }
}
