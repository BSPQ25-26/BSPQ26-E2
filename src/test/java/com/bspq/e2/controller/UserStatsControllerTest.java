package com.bspq.e2.controller;

import com.bspq.e2.dto.UserStatsDTO;
import com.bspq.e2.service.UserMovieStatusService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserStatsController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserStatsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserMovieStatusService statusService;

    @Test
    void getStats_withQueryUserId_returnsUserStats() throws Exception {
        when(statusService.getUserStats(1L))
                .thenReturn(new UserStatsDTO(3, 360, 2, 1, 4));

        mockMvc.perform(get("/api/me/stats").param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMoviesWatched").value(3))
                .andExpect(jsonPath("$.totalWatchTimeMinutes").value(360))
                .andExpect(jsonPath("$.likedCount").value(2))
                .andExpect(jsonPath("$.dislikedCount").value(1))
                .andExpect(jsonPath("$.watchLaterCount").value(4));
    }

    @Test
    void getStats_withHeaderUserId_returnsUserStats() throws Exception {
        when(statusService.getUserStats(2L))
                .thenReturn(new UserStatsDTO(1, 90, 1, 0, 0));

        mockMvc.perform(get("/api/me/stats").header("X-User-Id", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMoviesWatched").value(1))
                .andExpect(jsonPath("$.totalWatchTimeMinutes").value(90));
    }

    @Test
    void getStats_withoutUserId_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/me/stats"))
                .andExpect(status().isBadRequest());
    }
}
