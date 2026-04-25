package com.bspq.e2.performance;

import com.bspq.e2.model.Movie;
import com.bspq.e2.model.User;
import com.bspq.e2.model.UserMovieStatus;
import com.bspq.e2.repository.MovieRepository;
import com.bspq.e2.repository.UserMovieStatusRepository;
import com.bspq.e2.repository.UserRepository;
import com.bspq.e2.service.UserMovieStatusService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Performance tests for service-layer operations.
 *
 * These tests verify that critical operations complete within acceptable
 * time bounds under volume scenarios. No real database is required —
 * all dependencies are mocked, so the overhead measured is purely
 * in-process business logic.
 *
 * Run with: mvn test -Dgroups=performance
 */
@Tag("performance")
class UserMovieStatusServicePerformanceTest {

    private UserMovieStatusRepository statusRepository;
    private UserRepository userRepository;
    private MovieRepository movieRepository;
    private UserMovieStatusService service;

    private User user;
    private Movie movie;

    @BeforeEach
    void setUp() {
        statusRepository = mock(UserMovieStatusRepository.class);
        userRepository   = mock(UserRepository.class);
        movieRepository  = mock(MovieRepository.class);
        service = new UserMovieStatusService(statusRepository, userRepository, movieRepository);

        user = new User();
        user.setId(1L);
        user.setUsername("perfuser");
        user.setRole(User.Role.USER);

        movie = new Movie();
        movie.setId(1L);
        movie.setTitle("Perf Movie");
        movie.setGenre("Action");
        movie.setYear(2024);

        // Default stub: create a new status
        when(statusRepository.findByUserIdAndMovieId(anyLong(), anyLong()))
                .thenReturn(Optional.empty());
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(user));
        when(movieRepository.findById(anyLong())).thenReturn(Optional.of(movie));
        when(statusRepository.save(any(UserMovieStatus.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    /**
     * saveForLater must process 1 000 requests in under 2 seconds.
     */
    @Test
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void saveForLater_1000Calls_completesWithin2Seconds() {
        for (int i = 0; i < 1_000; i++) {
            service.saveForLater(1L, (long) i);
        }
    }

    /**
     * markAsWatched must process 1 000 requests in under 2 seconds.
     */
    @Test
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void markAsWatched_1000Calls_completesWithin2Seconds() {
        for (int i = 0; i < 1_000; i++) {
            service.markAsWatched(1L, (long) i);
        }
    }

    /**
     * getStatus must resolve 5 000 lookups in under 2 seconds.
     * This simulates the catalog page loading statuses for many movies.
     */
    @Test
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void getStatus_5000Calls_completesWithin2Seconds() {
        when(statusRepository.findByUserIdAndMovieId(anyLong(), anyLong()))
                .thenReturn(Optional.empty()); // returns default DTO
        for (int i = 0; i < 5_000; i++) {
            service.getStatus(1L, (long) i);
        }
    }

    /**
     * updateNote must handle 500 note saves in under 1 second.
     */
    @Test
    @Timeout(value = 1, unit = TimeUnit.SECONDS)
    void updateNote_500Calls_completesWithin1Second() {
        for (int i = 0; i < 500; i++) {
            service.updateNote(1L, (long) i, "Note number " + i);
        }
    }

    /**
     * getWatchLaterList on a large list (500 items) must complete in under 500ms.
     * Verifies that DTO mapping of a large list is efficient.
     */
    @Test
    @Timeout(value = 500, unit = TimeUnit.MILLISECONDS)
    void getWatchLaterList_largeList_mappingIsEfficient() {
        List<UserMovieStatus> bigList = buildStatusList(500);
        when(statusRepository.findByUserIdAndWatchLaterTrue(1L)).thenReturn(bigList);

        var result = service.getWatchLaterList(1L);

        assertThat(result).hasSize(500);
    }

    /**
     * getWatchedList on a large list (500 items) must complete in under 500ms.
     */
    @Test
    @Timeout(value = 500, unit = TimeUnit.MILLISECONDS)
    void getWatchedList_largeList_mappingIsEfficient() {
        List<UserMovieStatus> bigList = buildStatusList(500);
        when(statusRepository.findByUserIdAndWatchedTrue(1L)).thenReturn(bigList);

        var result = service.getWatchedList(1L);

        assertThat(result).hasSize(500);
    }

    /**
     * Mixed workflow: save → watch → like, repeated 200 times. Must complete in 1s.
     * Simulates a realistic burst of user interactions.
     */
    @Test
    @Timeout(value = 1, unit = TimeUnit.SECONDS)
    void mixedWorkflow_200Iterations_completesWithin1Second() {
        for (int i = 0; i < 200; i++) {
            long movieId = (long) i;

            // each call gets a fresh writable status
            UserMovieStatus st = freshStatus();
            when(statusRepository.findByUserIdAndMovieId(1L, movieId))
                    .thenReturn(Optional.of(st));

            service.saveForLater(1L, movieId);
            service.markAsWatched(1L, movieId);
            service.likeMovie(1L, movieId);
            service.updateNote(1L, movieId, "Quick note for movie " + i);
        }
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private UserMovieStatus freshStatus() {
        UserMovieStatus s = new UserMovieStatus();
        s.setUser(user);
        s.setMovie(movie);
        return s;
    }

    private List<UserMovieStatus> buildStatusList(int count) {
        List<UserMovieStatus> list = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            Movie m = new Movie();
            m.setId((long) i);
            m.setTitle("Movie " + i);
            UserMovieStatus s = new UserMovieStatus();
            s.setUser(user);
            s.setMovie(m);
            list.add(s);
        }
        return list;
    }
}
