package com.bspq.e2.controller;

import com.bspq.e2.model.Movie;
import com.bspq.e2.repository.MovieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private static final String ADMIN_ROLE = "ADMIN";

    private final MovieRepository movieRepository;

    public MovieController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping
    public ResponseEntity<List<Movie>> getMovies(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year) {
        if (genre != null && !genre.isBlank()) {
            return ResponseEntity.ok(movieRepository.findByGenre(genre));
        }
        if (year != null) {
            return ResponseEntity.ok(movieRepository.findByYear(year));
        }
        if (query != null && !query.isBlank()) {
            return ResponseEntity.ok(movieRepository.findByTitleContainingIgnoreCase(query));
        }
        return ResponseEntity.ok(movieRepository.findAll());
    }
    
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        Movie savedMovie = movieRepository.save(movie);
        return ResponseEntity.ok(savedMovie);
    }

    @PutMapping("/{movieId}")
    public ResponseEntity<?> updateMovie(
            @PathVariable Long movieId,
            @RequestBody Movie movie,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!isAdmin(role)) {
            return ResponseEntity.status(403).body("Admin role required");
        }

        Optional<Movie> movieOptional = movieRepository.findById(movieId);
        if (movieOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Movie existingMovie = movieOptional.get();
        existingMovie.setTitle(movie.getTitle());
        existingMovie.setYear(movie.getYear());
        existingMovie.setGenre(movie.getGenre());
        existingMovie.setDuration(movie.getDuration());
        existingMovie.setSynopsis(movie.getSynopsis());
        existingMovie.setPosterUrl(movie.getPosterUrl());

        Movie updatedMovie = movieRepository.save(existingMovie);
        return ResponseEntity.ok(updatedMovie);
    }

    @DeleteMapping("/{movieId}")
    public ResponseEntity<?> deleteMovie(
            @PathVariable Long movieId,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!isAdmin(role)) {
            return ResponseEntity.status(403).body("Admin role required");
        }

        if (!movieRepository.existsById(movieId)) {
            return ResponseEntity.notFound().build();
        }

        movieRepository.deleteById(movieId);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(String role) {
        return role != null && ADMIN_ROLE.equalsIgnoreCase(role.trim());
    }
}
