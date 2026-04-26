package com.bspq.e2.repository;

import com.bspq.e2.model.Movie;
import com.bspq.e2.model.UserMovieStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserMovieStatusRepository extends JpaRepository<UserMovieStatus, Long> {

    Optional<UserMovieStatus> findByUserIdAndMovieId(Long userId, Long movieId);

    List<UserMovieStatus> findByUserIdAndWatchLaterTrue(Long userId);

    List<UserMovieStatus> findByUserIdAndWatchedTrue(Long userId);

    List<UserMovieStatus> findByUserIdAndLikedTrue(Long userId);

    List<UserMovieStatus> findByUserIdAndDislikedTrue(Long userId);

    @Query("SELECT s.movie FROM UserMovieStatus s WHERE s.user.id = :userId AND s.watchLater = true")
    List<Movie> findMoviesByUserIdAndWatchLaterTrue(@Param("userId") Long userId);

    @Query("SELECT s.movie FROM UserMovieStatus s WHERE s.user.id = :userId AND s.watched = true")
    List<Movie> findMoviesByUserIdAndWatchedTrue(@Param("userId") Long userId);

    @Query("SELECT s.movie FROM UserMovieStatus s WHERE s.user.id = :userId AND s.liked = true")
    List<Movie> findMoviesByUserIdAndLikedTrue(@Param("userId") Long userId);

    @Query("SELECT s.movie FROM UserMovieStatus s WHERE s.user.id = :userId AND s.disliked = true")
    List<Movie> findMoviesByUserIdAndDislikedTrue(@Param("userId") Long userId);
}