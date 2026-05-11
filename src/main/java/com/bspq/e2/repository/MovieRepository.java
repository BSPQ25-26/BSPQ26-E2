package com.bspq.e2.repository;

import com.bspq.e2.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Set;

public interface MovieRepository extends JpaRepository<Movie, Long> {
    List<Movie> findByTitleContainingIgnoreCase(String title);
    List<Movie> findByGenre(String genre);
    List<Movie> findByYear(int year);
    List<Movie> findByGenreIn(List<String> genres);
    List<Movie> findByGenreInAndIdNotIn(List<String> genres, Set<Long> ids);
}