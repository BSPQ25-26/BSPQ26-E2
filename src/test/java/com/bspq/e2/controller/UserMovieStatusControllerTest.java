package com.bspq.e2.controller;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.service.UserMovieStatusService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    void getWatchLaterList_returnsList() throws Exception {
        when(statusService.getWatchLaterList(1L)).thenReturn(List.of(
                dto(10L, true, false, false, false),
                dto(11L, true, false, false, false)
        ));

        mockMvc.perform(get("/api/users/1/movies/watch-later"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].movieId").value(10))
                .andExpect(jsonPath("$[1].movieId").value(11));
    }

    @Test
    void markAsWatched_returnsUpdatedStatus() throws Exception {
        when(statusService.markAsWatched(1L, 10L)).thenReturn(dto(10L, false, true, false, false));

        mockMvc.perform(post("/api/users/1/movies/10/status/watched"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.watched").value(true));
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
    void getStatus_returnsCurrentStatus() throws Exception {
        when(statusService.getStatus(1L, 10L)).thenReturn(dto(10L, true, false, false, false));

        mockMvc.perform(get("/api/users/1/movies/10/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movieId").value(10))
                .andExpect(jsonPath("$.watchLater").value(true));
    }
}
