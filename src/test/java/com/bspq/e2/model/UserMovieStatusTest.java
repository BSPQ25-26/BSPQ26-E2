package com.bspq.e2.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UserMovieStatusTest {

    @Test
    void saveForLater_setsWatchLaterAndClearsWatched() {
        UserMovieStatus status = new UserMovieStatus();
        status.markAsWatched();

        status.saveForLater();

        assertThat(status.isWatchLater()).isTrue();
        assertThat(status.isWatched()).isFalse();
    }

    @Test
    void removeFromWatchLater_unsetsFlag() {
        UserMovieStatus status = new UserMovieStatus();
        status.saveForLater();

        status.removeFromWatchLater();

        assertThat(status.isWatchLater()).isFalse();
    }

    @Test
    void markAsWatched_setsWatchedAndClearsWatchLater() {
        UserMovieStatus status = new UserMovieStatus();
        status.saveForLater();

        status.markAsWatched();

        assertThat(status.isWatched()).isTrue();
        assertThat(status.isWatchLater()).isFalse();
    }

    @Test
    void removeFromWatched_unsetsWatchedAndRatings() {
        UserMovieStatus status = new UserMovieStatus();
        status.markAsWatched();
        status.like();

        status.removeFromWatched();

        assertThat(status.isWatched()).isFalse();
        assertThat(status.isLiked()).isFalse();
        assertThat(status.isDisliked()).isFalse();
    }

    @Test
    void like_requiresWatchedMovie() {
        UserMovieStatus status = new UserMovieStatus();

        assertThatThrownBy(status::like)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot rate");
    }

    @Test
    void dislike_requiresWatchedMovie() {
        UserMovieStatus status = new UserMovieStatus();

        assertThatThrownBy(status::dislike)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot rate");
    }

    @Test
    void like_setsLikedAndClearsDisliked() {
        UserMovieStatus status = new UserMovieStatus();
        status.markAsWatched();
        status.dislike();

        status.like();

        assertThat(status.isLiked()).isTrue();
        assertThat(status.isDisliked()).isFalse();
    }

    @Test
    void dislike_setsDislikedAndClearsLiked() {
        UserMovieStatus status = new UserMovieStatus();
        status.markAsWatched();
        status.like();

        status.dislike();

        assertThat(status.isDisliked()).isTrue();
        assertThat(status.isLiked()).isFalse();
    }

    @Test
    void removeLike_unsetsLikedFlag() {
        UserMovieStatus status = new UserMovieStatus();
        status.markAsWatched();
        status.like();

        status.removeLike();

        assertThat(status.isLiked()).isFalse();
    }

    @Test
    void removeDislike_unsetsDislikedFlag() {
        UserMovieStatus status = new UserMovieStatus();
        status.markAsWatched();
        status.dislike();

        status.removeDislike();

        assertThat(status.isDisliked()).isFalse();
    }

    @Test
    void note_canBeStoredAndRead() {
        UserMovieStatus status = new UserMovieStatus();

        status.setNote("Remember the ending");

        assertThat(status.getNote()).isEqualTo("Remember the ending");
    }

    @Test
    void onUpdate_refreshesUpdatedAt() {
        UserMovieStatus status = new UserMovieStatus();
        var previous = status.getUpdatedAt();

        status.onUpdate();

        assertThat(status.getUpdatedAt()).isAfterOrEqualTo(previous);
    }
}
