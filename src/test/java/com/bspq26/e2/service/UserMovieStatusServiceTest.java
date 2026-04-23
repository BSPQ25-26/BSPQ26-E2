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

    @Mock
    UserMovieStatusRepository statusRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    MovieRepository movieRepository;

    @InjectMocks
    UserMovieStatusService service;

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
        when(statusRepository.save(any(UserMovieStatus.class))).thenAnswer(i -> i.getArgument(0, UserMovieStatus.class));
    }

    private void mockCreate() {
        when(statusRepository.findByUserIdAndMovieId(1L, 10L))
                .thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(movieRepository.findById(10L)).thenReturn(Optional.of(movie));
        when(statusRepository.save(any(UserMovieStatus.class))).thenAnswer(i -> i.getArgument(0, UserMovieStatus.class));
    }

    // Watch Later

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
        existing.markAsWatched();
        existing.dislike();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.likeMovie(1L, 10L);

        assertThat(dto.isLiked()).isTrue();
        assertThat(dto.isDisliked()).isFalse();
    }

    @Test
    void dislike_clearsLike_mutualExclusivity() {
        UserMovieStatus existing = freshStatus();
        existing.markAsWatched();
        existing.like();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.dislikeMovie(1L, 10L);

        assertThat(dto.isDisliked()).isTrue();
        assertThat(dto.isLiked()).isFalse();
    }

    @Test
    void removeLike_unsetsFlag() {
        UserMovieStatus existing = freshStatus();
        existing.markAsWatched();
        existing.like();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.removeLike(1L, 10L);

        assertThat(dto.isLiked()).isFalse();
    }

    @Test
    void removeDislike_unsetsFlag() {
        UserMovieStatus existing = freshStatus();
        existing.markAsWatched();
        existing.dislike();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.removeDislike(1L, 10L);

        assertThat(dto.isDisliked()).isFalse();
    }

    // Get status

    @Test
    void getStatus_returnsAllFalse_whenNoStatusExists() {
        when(statusRepository.findByUserIdAndMovieId(1L, 10L))
                .thenReturn(Optional.empty());

        MovieStatusDTO dto = service.getStatus(1L, 10L);

        assertThat(dto.isWatchLater()).isFalse();
        assertThat(dto.isWatched()).isFalse();
        assertThat(dto.isLiked()).isFalse();
        assertThat(dto.isDisliked()).isFalse();
        assertThat(dto.getNote()).isNull();
    }

    @Test
    void updateNote_trimsAndStoresNote() {
        mockCreate();

        MovieStatusDTO dto = service.updateNote(1L, 10L, "  Great pacing and soundtrack.  ");

        assertThat(dto.getNote()).isEqualTo("Great pacing and soundtrack.");
    }

    @Test
    void updateNote_clearsNoteWhenBlank() {
        UserMovieStatus existing = freshStatus();
        existing.setNote("Old note");
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.updateNote(1L, 10L, "   ");

        assertThat(dto.getNote()).isNull();
    }

    @Test
    void markAsWatched_keepsHistory() {
        mockCreate();
        MovieStatusDTO dto = service.markAsWatched(1L, 10L);
        assertThat(dto.isWatched()).isTrue();
    }

    @Test
    void saveForLater_remembersMovie() {
        mockCreate();
        MovieStatusDTO dto = service.saveForLater(1L, 10L);
        assertThat(dto.isWatchLater()).isTrue();
    }

    @Test
    void likeOrDislike_recordsPreference() {
        UserMovieStatus existing = freshStatus();
        existing.markAsWatched();
        mockFindOrCreate(existing);

        MovieStatusDTO dtoLike = service.likeMovie(1L, 10L);
        assertThat(dtoLike.isLiked()).isTrue();

        MovieStatusDTO dtoDislike = service.dislikeMovie(1L, 10L);
        assertThat(dtoDislike.isDisliked()).isTrue();
    }

    @Test
    void rateMovie_onlyIfWatched_throwsIfNotWatched() {
        UserMovieStatus existing = freshStatus();
        // Not watched by default
        when(statusRepository.findByUserIdAndMovieId(1L, 10L))
                .thenReturn(Optional.of(existing));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.likeMovie(1L, 10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot rate");

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.dislikeMovie(1L, 10L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot rate");
    }

    @Test
    void saveForLater_doesNotClearExistingLike() {
        UserMovieStatus existing = freshStatus();
        existing.markAsWatched();
        existing.like();
        mockFindOrCreate(existing);

        MovieStatusDTO dto = service.saveForLater(1L, 10L);

        assertThat(dto.isWatchLater()).isTrue();
        assertThat(dto.isWatched()).isFalse();
        assertThat(dto.isLiked()).isTrue(); // Like should be preserved
    }

    @Test
    void markAsWatched_doesNotClearLike() {
        UserMovieStatus existing = freshStatus();
        existing.markAsWatched();
        existing.like();
        existing.saveForLater();
        mockFindOrCreate(existing);
        MovieStatusDTO dto = service.markAsWatched(1L, 10L);

        assertThat(dto.isWatched()).isTrue();
        assertThat(dto.isLiked()).isTrue();
        assertThat(dto.isWatchLater()).isFalse();
    }
}