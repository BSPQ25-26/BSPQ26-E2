package com.bspq.e2.controller;

import com.bspq.e2.model.Movie;
import com.bspq.e2.service.RecommendationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RecommendationController.class)
@AutoConfigureMockMvc(addFilters = false)
class RecommendationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RecommendationService recommendationService;

    private Movie movie(Long id, String title, String genre, int year) {
        Movie movie = new Movie();
        movie.setId(id);
        movie.setTitle(title);
        movie.setGenre(genre);
        movie.setYear(year);
        movie.setDuration(120);
        movie.setSynopsis("Synopsis");
        movie.setPosterUrl("https://poster.example/img.jpg");
        return movie;
    }

    @Test
    void getUserRecommendations_returnsRecommendations() throws Exception {
        when(recommendationService.getRecommendations(1L, 10))
                .thenReturn(List.of(movie(1L, "Inception", "Sci-Fi", 2010)));

        mockMvc.perform(get("/api/users/1/recommendations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Inception"))
                .andExpect(jsonPath("$[0].genre").value("Sci-Fi"));
    }

    @Test
    void getUserRecommendations_withLimit_returnsLimitedResults() throws Exception {
        when(recommendationService.getRecommendations(1L, 5))
                .thenReturn(List.of(movie(2L, "The Matrix", "Sci-Fi", 1999)));

        mockMvc.perform(get("/api/users/1/recommendations").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("The Matrix"));
    }

    @Test
    void getUserRecommendations_noRecommendations_returnsEmptyList() throws Exception {
        when(recommendationService.getRecommendations(1L, 10))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/users/1/recommendations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void getGeneralRecommendations_returnsRecommendations() throws Exception {
        when(recommendationService.getGeneralRecommendations(10))
                .thenReturn(List.of(movie(3L, "The Godfather", "Drama", 1972)));

        mockMvc.perform(get("/api/recommendations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("The Godfather"));
    }

    @Test
    void getGeneralRecommendations_withLimit_returnsLimitedResults() throws Exception {
        when(recommendationService.getGeneralRecommendations(3))
                .thenReturn(List.of(movie(4L, "Pulp Fiction", "Drama", 1994)));

        mockMvc.perform(get("/api/recommendations").param("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Pulp Fiction"));
    }

    @Test
    void getGeneralRecommendations_noRecommendations_returnsEmptyList() throws Exception {
        when(recommendationService.getGeneralRecommendations(10))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/recommendations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}