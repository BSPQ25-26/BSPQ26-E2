package com.bspq.e2.controller;

import com.bspq.e2.model.Movie;
import com.bspq.e2.repository.MovieRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private static final Logger logger = LoggerFactory.getLogger(MovieController.class);
    private static final String ADMIN_ROLE = "ADMIN";

    private final MovieRepository movieRepository;

    public MovieController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String query) {
        if (genre != null && !genre.isEmpty()) {
            return ResponseEntity.ok(movieRepository.findByGenre(genre));
        }
        if (year != null) {
            return ResponseEntity.ok(movieRepository.findByYear(year));
        }
        if (query != null && !query.isEmpty()) {
            return ResponseEntity.ok(movieRepository.findByTitleContainingIgnoreCase(query));
        }
        return ResponseEntity.ok(movieRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        return ResponseEntity.ok(movieRepository.save(movie));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMovie(
            @PathVariable Long id,
            @RequestBody Movie payload,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!ADMIN_ROLE.equals(role)) {
            return ResponseEntity.status(403).body("Admin role required");
        }

        Optional<Movie> existing = movieRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Movie movie = existing.get();
        movie.setTitle(payload.getTitle());
        movie.setGenre(payload.getGenre());
        movie.setYear(payload.getYear());
        movie.setDuration(payload.getDuration());
        movie.setSynopsis(payload.getSynopsis());
        movie.setPosterUrl(payload.getPosterUrl());

        return ResponseEntity.ok(movieRepository.save(movie));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMovie(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!ADMIN_ROLE.equals(role)) {
            return ResponseEntity.status(403).body("Admin role required");
        }

        if (!movieRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        movieRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
