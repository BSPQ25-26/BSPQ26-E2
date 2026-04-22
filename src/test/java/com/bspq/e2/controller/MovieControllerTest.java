package com.bspq.e2.controller;

import com.bspq.e2.model.Movie;
import com.bspq.e2.repository.MovieRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MovieController.class)
@AutoConfigureMockMvc(addFilters = false)
class MovieControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MovieRepository movieRepository;

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
    void getMovies_withGenreFilter_returnsGenreMatches() throws Exception {
        when(movieRepository.findByGenre("Sci-Fi")).thenReturn(List.of(movie(1L, "Interstellar", "Sci-Fi", 2014)));

        mockMvc.perform(get("/api/movies").param("genre", "Sci-Fi"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Interstellar"));
    }

    @Test
    void getMovies_withYearFilter_returnsYearMatches() throws Exception {
        when(movieRepository.findByYear(2010)).thenReturn(List.of(movie(2L, "Inception", "Sci-Fi", 2010)));

        mockMvc.perform(get("/api/movies").param("year", "2010"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].year").value(2010));
    }

    @Test
    void getMovies_withQueryFilter_returnsTitleMatches() throws Exception {
        when(movieRepository.findByTitleContainingIgnoreCase("godfather"))
                .thenReturn(List.of(movie(3L, "The Godfather", "Drama", 1972)));

        mockMvc.perform(get("/api/movies").param("query", "godfather"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("The Godfather"));
    }

    @Test
    void getMovies_withoutFilters_returnsAll() throws Exception {
        when(movieRepository.findAll()).thenReturn(List.of(movie(4L, "Superbad", "Comedy", 2007)));

        mockMvc.perform(get("/api/movies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].genre").value("Comedy"));
    }

    @Test
    void createMovie_returnsSavedMovie() throws Exception {
        Movie saved = movie(5L, "Arrival", "Sci-Fi", 2016);
        when(movieRepository.save(any(Movie.class))).thenReturn(saved);

        mockMvc.perform(post("/api/movies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saved)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.title").value("Arrival"));
    }

    @Test
    void updateMovie_withoutAdminRole_returnsForbidden() throws Exception {
        Movie payload = movie(null, "Updated", "Drama", 2020);

        mockMvc.perform(put("/api/movies/99")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$").value("Admin role required"));

        verify(movieRepository, never()).save(any(Movie.class));
    }

    @Test
    void updateMovie_withAdminRole_notFoundReturns404() throws Exception {
        when(movieRepository.findById(99L)).thenReturn(Optional.empty());
        Movie payload = movie(null, "Updated", "Drama", 2020);

        mockMvc.perform(put("/api/movies/99")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateMovie_withAdminRole_updatesMovie() throws Exception {
        Movie existing = movie(10L, "Old title", "Drama", 1990);
        Movie payload = movie(null, "New title", "Thriller", 2001);
        payload.setDuration(140);
        payload.setSynopsis("New synopsis");

        when(movieRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(movieRepository.save(any(Movie.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/movies/10")
                        .header("X-User-Role", "ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("New title"))
                .andExpect(jsonPath("$.genre").value("Thriller"))
                .andExpect(jsonPath("$.year").value(2001));
    }

    @Test
    void deleteMovie_withoutAdminRole_returnsForbidden() throws Exception {
        mockMvc.perform(delete("/api/movies/77"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$").value("Admin role required"));

        verify(movieRepository, never()).deleteById(77L);
    }

    @Test
    void deleteMovie_withAdminRole_notFoundReturns404() throws Exception {
        when(movieRepository.existsById(77L)).thenReturn(false);

        mockMvc.perform(delete("/api/movies/77").header("X-User-Role", "ADMIN"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteMovie_withAdminRole_deletesMovie() throws Exception {
        when(movieRepository.existsById(77L)).thenReturn(true);

        mockMvc.perform(delete("/api/movies/77").header("X-User-Role", "ADMIN"))
                .andExpect(status().isNoContent());

        verify(movieRepository).deleteById(77L);
    }
}
