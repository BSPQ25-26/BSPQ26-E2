package com.bspq.e2.controller;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.model.Movie;
import com.bspq.e2.service.UserMovieStatusService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserMovieStatusController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserMovieStatusControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserMovieStatusService statusService;

    private MovieStatusDTO dto(long movieId, boolean watchLater, boolean watched, boolean liked, boolean disliked) {
        return new MovieStatusDTO(movieId, watchLater, watched, liked, disliked);
    }

    private Movie movie(long id, String title) {
        Movie movie = new Movie();
        movie.setId(id);
        movie.setTitle(title);
        return movie;
    }

    @Test
    void saveForLater_returnsUpdatedStatus() throws Exception {
        when(statusService.saveForLater(1L, 10L)).thenReturn(dto(10L, true, false, false, false));

        mockMvc.perform(post("/api/users/1/movies/10/status/watch-later"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieId").value(10))
                .andExpect(jsonPath("$.watchLater").value(true));
    }

    @Test
    void removeFromWatchLater_returnsUpdatedStatus() throws Exception {
        when(statusService.removeFromWatchLater(1L, 10L)).thenReturn(dto(10L, false, false, false, false));

        mockMvc.perform(delete("/api/users/1/movies/10/status/watch-later"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.watchLater").value(false));
    }

    @Test
    void getWatchLaterList_returnsMovieList() throws Exception {
        when(statusService.getWatchLaterList(1L)).thenReturn(List.of(
                movie(10L, "Interstellar"),
                movie(11L, "Arrival")
        ));

        mockMvc.perform(get("/api/users/1/movies/watch-later"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[1].title").value("Arrival"));
    }

    @Test
    void getWatchLaterMovies_returnsMovieList() throws Exception {
        when(statusService.getWatchLaterMovies(1L)).thenReturn(List.of(
                movie(10L, "Interstellar"),
                movie(11L, "Arrival")
        ));

        mockMvc.perform(get("/api/users/1/movies/watch-later/movies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[1].title").value("Arrival"));
    }

    @Test
    void markAsWatched_returnsUpdatedStatus() throws Exception {
        when(statusService.markAsWatched(1L, 10L)).thenReturn(dto(10L, false, true, false, false));

        mockMvc.perform(post("/api/users/1/movies/10/status/watched"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.watched").value(true));
    }

    @Test
    void removeFromWatched_returnsUpdatedStatus() throws Exception {
        when(statusService.removeFromWatched(1L, 10L)).thenReturn(dto(10L, false, false, false, false));

        mockMvc.perform(delete("/api/users/1/movies/10/status/watched"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.watched").value(false));
    }

    @Test
    void getWatchedList_returnsMovieList() throws Exception {
        when(statusService.getWatchedList(1L)).thenReturn(List.of(movie(10L, "Inception")));

        mockMvc.perform(get("/api/users/1/movies/watched"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Inception"));
    }

    @Test
    void likeMovie_returnsUpdatedStatus() throws Exception {
        when(statusService.likeMovie(1L, 10L)).thenReturn(dto(10L, false, true, true, false));

        mockMvc.perform(post("/api/users/1/movies/10/status/like"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true));
    }

    @Test
    void removeLike_returnsUpdatedStatus() throws Exception {
        when(statusService.removeLike(1L, 10L)).thenReturn(dto(10L, false, true, false, false));

        mockMvc.perform(delete("/api/users/1/movies/10/status/like"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(false));
    }

    @Test
    void getLikedList_returnsMovieList() throws Exception {
        when(statusService.getLikedList(1L)).thenReturn(List.of(movie(12L, "The Matrix")));

        mockMvc.perform(get("/api/users/1/movies/liked"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(12))
                .andExpect(jsonPath("$[0].title").value("The Matrix"));
    }

    @Test
    void dislikeMovie_returnsUpdatedStatus() throws Exception {
        when(statusService.dislikeMovie(1L, 10L)).thenReturn(dto(10L, false, true, false, true));

        mockMvc.perform(post("/api/users/1/movies/10/status/dislike"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disliked").value(true));
    }

    @Test
    void removeDislike_returnsUpdatedStatus() throws Exception {
        when(statusService.removeDislike(1L, 10L)).thenReturn(dto(10L, false, true, false, false));

        mockMvc.perform(delete("/api/users/1/movies/10/status/dislike"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.disliked").value(false));
    }

    @Test
    void getDislikedList_returnsMovieList() throws Exception {
        when(statusService.getDislikedList(1L)).thenReturn(List.of(movie(13L, "Cats")));

        mockMvc.perform(get("/api/users/1/movies/disliked"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(13))
                .andExpect(jsonPath("$[0].title").value("Cats"));
    }

    @Test
    void getStatus_returnsCurrentStatus() throws Exception {
        when(statusService.getStatus(1L, 10L)).thenReturn(dto(10L, true, false, false, false));

        mockMvc.perform(get("/api/users/1/movies/10/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieId").value(10))
                .andExpect(jsonPath("$.watchLater").value(true));
    }

    @Test
    void updateNote_returnsUpdatedStatus() throws Exception {
        when(statusService.updateNote(1L, 10L, "Great movie"))
                .thenReturn(new MovieStatusDTO(10L, false, true, false, false, "Great movie"));

        mockMvc.perform(put("/api/users/1/movies/10/status/note")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"note\":\"Great movie\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.note").value("Great movie"));
    }

    @Test
    void clearNote_returnsUpdatedStatus() throws Exception {
        when(statusService.updateNote(1L, 10L, null))
                .thenReturn(new MovieStatusDTO(10L, false, true, false, false, null));

        mockMvc.perform(delete("/api/users/1/movies/10/status/note"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.note").doesNotExist());
    }
}
