package com.bspq26.e2.service;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.model.Movie;
import com.bspq.e2.model.User;
import com.bspq.e2.model.UserMovieStatus;
import com.bspq.e2.repository.MovieRepository;
import com.bspq.e2.repository.UserMovieStatusRepository;
import com.bspq.e2.repository.UserRepository;
import com.bspq.e2.service.UserMovieStatusService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserMovieStatusServiceTest {

    @Mock UserMovieStatusRepository statusRepository;
    @Mock UserRepository userRepository;
    @Mock MovieRepository movieRepository;

    @InjectMocks UserMovieStatusService service;

    private User user;
    private Movie movie;

    @BeforeEach
    void setUp() {
        user = new User();
        movie = new Movie();
    }

    private UserMovieStatus freshStatus() {
        UserMovieStatus s = new UserMovieStatus();
        s.setUser(user);
        s.setMovie(movie);
        return s;
    }

    private void mockFindOrCreate(UserMovieStatus existing) {
        when(statusRepository.findByUserIdAndMovieId(1L, 10L))
                .thenReturn(Optional.of(existing));
        when(statusRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    private void mockCreate() {
        when(statusRepository.findByUserIdAndMovieId(1L, 10L))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(movieRepository.findById(10L)).thenReturn(Optional.of(movie));
        when(statusRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }

    //  Watch Later

    @Test
    void saveForLater_setsWatchLater() {
        mockCreate();
        MovieStatusDTO dto = service.saveForLater(1L, 10L);
        assertThat(dto.isWatchLater()).isTrue();
        assertThat(dto.isWatched()).isFalse();
    }

    @Test
    void saveForLater_clearsWatched_mutualExclusivity() {
        UserMovieStatus existing = freshStatus();
        existing.markAsWatched();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.saveForLater(1L, 10L);

        assertThat(dto.isWatchLater()).isTrue();
        assertThat(dto.isWatched()).isFalse();
    }

    @Test
    void markAsWatched_clearsWatchLater_mutualExclusivity() {
        UserMovieStatus existing = freshStatus();
        existing.saveForLater();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.markAsWatched(1L, 10L);

        assertThat(dto.isWatched()).isTrue();
        assertThat(dto.isWatchLater()).isFalse();
    }

    @Test
    void removeFromWatchLater_unsetsFlag() {
        UserMovieStatus existing = freshStatus();
        existing.saveForLater();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.removeFromWatchLater(1L, 10L);

        assertThat(dto.isWatchLater()).isFalse();
    }

    // Like / Dislike

    @Test
    void like_clearsDislike_mutualExclusivity() {
        UserMovieStatus existing = freshStatus();
        existing.dislike();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.likeMovie(1L, 10L);

        assertThat(dto.isLiked()).isTrue();
        assertThat(dto.isDisliked()).isFalse();
    }

    @Test
    void dislike_clearsLike_mutualExclusivity() {
        UserMovieStatus existing = freshStatus();
        existing.like(); 
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.dislikeMovie(1L, 10L);

        assertThat(dto.isDisliked()).isTrue();
        assertThat(dto.isLiked()).isFalse();
    }

    @Test
    void removeLike_unsetsFlag() {
        UserMovieStatus existing = freshStatus();
        existing.like();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.removeLike(1L, 10L);

        assertThat(dto.isLiked()).isFalse();
    }

    @Test
    void removeDislike_unsetsFlag() {
        UserMovieStatus existing = freshStatus();
        existing.dislike();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.removeDislike(1L, 10L);

        assertThat(dto.isDisliked()).isFalse();
    }

    //  Get status

    @Test
    void getStatus_returnsAllFalse_whenNoStatusExists() {
        when(statusRepository.findByUserIdAndMovieId(1L, 10L))
                .thenReturn(Optional.empty());

        MovieStatusDTO dto = service.getStatus(1L, 10L);

        assertThat(dto.isWatchLater()).isFalse();
        assertThat(dto.isWatched()).isFalse();
        assertThat(dto.isLiked()).isFalse();
        assertThat(dto.isDisliked()).isFalse();
    }

    @Test
    void canLikeAndSaveForLater_simultaneously() {
        mockCreate();
        // Save for later
        service.saveForLater(1L, 10L);

        UserMovieStatus existing = freshStatus();
        existing.saveForLater();
        existing.like();
        mockFindOrCreate(existing);

        // Both states can coexist
        MovieStatusDTO dto = service.getStatus(1L, 10L);
        assertThat(existing.isWatchLater()).isTrue();
        assertThat(existing.isLiked()).isTrue();
    }
}