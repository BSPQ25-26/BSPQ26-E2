package com.bspq.e2.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = SecurityTestRoutes.class)
@Import(SecurityConfig.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void passwordEncoderHashesAndMatchesPassword() {
        String encodedPassword = passwordEncoder.encode("movie-secret");

        assertThat(encodedPassword).isNotEqualTo("movie-secret");
        assertThat(passwordEncoder.matches("movie-secret", encodedPassword)).isTrue();
        assertThat(passwordEncoder.matches("wrong-secret", encodedPassword)).isFalse();
    }

    @Test
    void publicFrontendAndMovieRoutesArePermitted() throws Exception {
        mockMvc.perform(get("/catalog.html"))
                .andExpect(status().isOk())
                .andExpect(content().string("catalog"));

        mockMvc.perform(get("/my-lists.html"))
                .andExpect(status().isOk())
                .andExpect(content().string("my-lists"));

        mockMvc.perform(post("/api/movies/test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(content().string("movie"));

        mockMvc.perform(get("/api/users/1/movies/watched"))
                .andExpect(status().isOk())
                .andExpect(content().string("user-movies"));
    }

    @Test
    void privateRoutesRequireAuthentication() throws Exception {
        mockMvc.perform(get("/private-area"))
                .andExpect(status().isForbidden());
    }

}

@RestController
class SecurityTestRoutes {

    @GetMapping("/catalog.html")
    String catalogPage() {
        return "catalog";
    }

    @GetMapping("/my-lists.html")
    String myListsPage() {
        return "my-lists";
    }

    @PostMapping("/api/movies/test")
    String createMovie() {
        return "movie";
    }

    @GetMapping("/api/users/1/movies/watched")
    String userMovies() {
        return "user-movies";
    }

    @GetMapping("/private-area")
    String privateArea() {
        return "private";
    }
}
