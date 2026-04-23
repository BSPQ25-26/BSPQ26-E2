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

    @Query("select s.movie from UserMovieStatus s where s.user.id = :userId and s.watchLater = true")
    List<Movie> findMoviesByUserIdAndWatchLaterTrue(@Param("userId") Long userId);

    @Query("select s.movie from UserMovieStatus s where s.user.id = :userId and s.watched = true")
    List<Movie> findMoviesByUserIdAndWatchedTrue(@Param("userId") Long userId);

    @Query("select s.movie from UserMovieStatus s where s.user.id = :userId and s.liked = true")
    List<Movie> findMoviesByUserIdAndLikedTrue(@Param("userId") Long userId);

    @Query("select s.movie from UserMovieStatus s where s.user.id = :userId and s.disliked = true")
    List<Movie> findMoviesByUserIdAndDislikedTrue(@Param("userId") Long userId);
}