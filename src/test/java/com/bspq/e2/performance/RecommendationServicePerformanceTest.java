package com.bspq.e2.performance;

import com.bspq.e2.model.Movie;
import com.bspq.e2.model.User;
import com.bspq.e2.model.UserMovieStatus;
import com.bspq.e2.repository.MovieRepository;
import com.bspq.e2.repository.UserMovieStatusRepository;
import com.bspq.e2.repository.UserRepository;
import com.bspq.e2.service.RecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@Tag("performance")
class RecommendationServicePerformanceTest {

    private UserMovieStatusRepository statusRepository;
    private UserRepository userRepository;
    private MovieRepository movieRepository;
    private RecommendationService service;

    private User user;
    private Movie movie;

    @BeforeEach
    void setUp() {
        statusRepository = mock(UserMovieStatusRepository.class);
        userRepository   = mock(UserRepository.class);
        movieRepository  = mock(MovieRepository.class);
        service = new RecommendationService(statusRepository, movieRepository, userRepository);

        user = new User();
        user.setId(1L);
        user.setUsername("recuser");
        user.setRole(User.Role.USER);

        movie = new Movie();
        movie.setId(1L);
        movie.setTitle("Recommended Movie");
        movie.setGenre("Sci-Fi");
        movie.setYear(2024);
    }

    @Test
    @Timeout(value = 2, unit = TimeUnit.SECONDS)
    void getRecommendations_100Calls_completesWithin2Seconds() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(user));
        when(statusRepository.findByUserId(anyLong())).thenReturn(Collections.emptyList());
        when(statusRepository.findByLikedTrue()).thenReturn(List.of(freshStatus(true, true)));
        when(movieRepository.findById(anyLong())).thenReturn(Optional.of(movie));

        for (int i = 0; i < 100; i++) {
            service.getRecommendations(1L, 10);
        }
    }

    @Test
    @Timeout(value = 1, unit = TimeUnit.SECONDS)
    void getRecommendations_withLikedGenres_usesGenreStrategy() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(user));
        when(statusRepository.findByUserId(anyLong())).thenReturn(List.of(freshStatus(true, true)));
        when(movieRepository.findByGenreInAndIdNotIn(anyList(), anySet()))
                .thenReturn(List.of(movie));
        when(movieRepository.findByGenreIn(anyList())).thenReturn(List.of(movie));

        List<Movie> result = service.getRecommendations(1L, 5);

        assertThat(result).isNotEmpty();
    }

    @Test
    @Timeout(value = 500, unit = TimeUnit.MILLISECONDS)
    void getRecommendations_popularFallback_returnsPopularMovies() {
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(user));
        when(statusRepository.findByUserId(anyLong())).thenReturn(Collections.emptyList());
        when(statusRepository.findByLikedTrue()).thenReturn(List.of(freshStatus(true, true)));
        when(movieRepository.findById(anyLong())).thenReturn(Optional.of(movie));

        List<Movie> result = service.getRecommendations(1L, 3);

        assertThat(result).isNotEmpty();
    }

    @Test
    @Timeout(value = 500, unit = TimeUnit.MILLISECONDS)
    void getGeneralRecommendations_returnsPopularMovies() {
        when(statusRepository.findByLikedTrue()).thenReturn(List.of(freshStatus(true, true)));
        when(movieRepository.findById(anyLong())).thenReturn(Optional.of(movie));

        List<Movie> result = service.getGeneralRecommendations(5);

        assertThat(result).isNotEmpty();
    }

    @Test
    @Timeout(value = 1, unit = TimeUnit.SECONDS)
    void getGeneralRecommendations_500Calls_completesWithin1Second() {
        when(statusRepository.findByLikedTrue()).thenReturn(List.of(freshStatus(true, true)));
        when(movieRepository.findById(anyLong())).thenReturn(Optional.of(movie));

        for (int i = 0; i < 500; i++) {
            service.getGeneralRecommendations(10);
        }
    }

    @Test
    @Timeout(value = 3, unit = TimeUnit.SECONDS)
    void collaborativeFiltering_withSimilarUsers_returnsRecommendations() {
        User u2 = new User();
        u2.setId(2L);
        u2.setUsername("similar");
        u2.setRole(User.Role.USER);

        Movie m2 = new Movie();
        m2.setId(2L);
        m2.setTitle("Similar User Movie");
        m2.setGenre("Sci-Fi");
        m2.setYear(2023);

        UserMovieStatus currentUserStatus = freshStatus(true, true);
        UserMovieStatus similarUserStatus = new UserMovieStatus();
        similarUserStatus.setUser(u2);
        similarUserStatus.setMovie(m2);
        similarUserStatus.markAsWatched();
        similarUserStatus.like();

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(statusRepository.findByUserId(1L)).thenReturn(List.of(currentUserStatus));
        when(statusRepository.findByUserIdNot(1L)).thenReturn(List.of(similarUserStatus));
        when(statusRepository.findByUserIdAndLikedTrue(1L)).thenReturn(List.of(currentUserStatus));
        when(statusRepository.findByLikedTrue()).thenReturn(List.of(currentUserStatus, similarUserStatus));
        when(movieRepository.findByGenreInAndIdNotIn(anyList(), anySet())).thenReturn(Collections.emptyList());
        when(movieRepository.findById(2L)).thenReturn(Optional.of(m2));

        List<Movie> result = service.getRecommendations(1L, 10);

        assertThat(result).isNotEmpty();
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private UserMovieStatus freshStatus(boolean liked, boolean watched) {
        UserMovieStatus s = new UserMovieStatus();
        s.setUser(user);
        s.setMovie(movie);
        if (liked || watched) {
            s.markAsWatched();
        }
        if (liked) {
            s.like();
        }
        return s;
    }
}