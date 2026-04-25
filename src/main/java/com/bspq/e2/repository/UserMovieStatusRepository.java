package com.bspq.e2.repository;

import com.bspq.e2.model.Movie;
import com.bspq.e2.model.UserMovieStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserMovieStatusRepository extends JpaRepository<UserMovieStatus, Long> {

    Optional<UserMovieStatus> findByUserIdAndMovieId(Long userId, Long movieId);

    @EntityGraph(attributePaths = {"movie"})
    List<UserMovieStatus> findByUserIdAndWatchLaterTrue(Long userId);

    @EntityGraph(attributePaths = {"movie"})
    List<UserMovieStatus> findByUserIdAndWatchedTrue(Long userId);

    @EntityGraph(attributePaths = {"movie"})
    List<UserMovieStatus> findByUserIdAndLikedTrue(Long userId);

    @EntityGraph(attributePaths = {"movie"})
    List<UserMovieStatus> findByUserIdAndDislikedTrue(Long userId);
}