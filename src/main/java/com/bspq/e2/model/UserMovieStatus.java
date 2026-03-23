package com.bspq.e2.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "user_movie_status",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "movie_id"})
)
public class UserMovieStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movie movie;

    @Column(name = "watch_later", nullable = false)
    private boolean watchLater = false;

    @Column(name = "watched", nullable = false)
    private boolean watched = false;

    @Column(name = "liked", nullable = false)
    private boolean liked = false;

    @Column(name = "disliked", nullable = false)
    private boolean disliked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void saveForLater() {
        this.watchLater = true;
        this.watched = false;
    }

    public void removeFromWatchLater() {
        this.watchLater = false;
    }

    public void markAsWatched() {
        this.watched = true;
        this.watchLater = false;
    }

    public void like() {
        this.liked = true;
        this.disliked = false;
    }

    public void dislike() {
        this.disliked = true;
        this.liked = false;
    }

    public void removeLike()    { this.liked = false; }
    public void removeDislike() { this.disliked = false; }

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Movie getMovie() { return movie; }
    public void setMovie(Movie movie) { this.movie = movie; }

    public boolean isWatchLater() { return watchLater; }
    public boolean isWatched()    { return watched; }
    public boolean isLiked()      { return liked; }
    public boolean isDisliked()   { return disliked; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
