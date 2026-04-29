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
    public ResponseEntity<List<Movie>> getAllMovies(@RequestParam(required = false) String query) {
        if (query != null && !query.isEmpty()) {
            return ResponseEntity.ok(movieRepository.findByTitleContainingIgnoreCase(query));
        }
        return ResponseEntity.ok(movieRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable Long id) {
        return movieRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping(params = "genre")
    public ResponseEntity<List<Movie>> getMoviesByGenre(@RequestParam String genre) {
        if (genre != null && !genre.isEmpty()) {
        	return ResponseEntity.ok(movieRepository.findByGenre(genre));
        }
        return ResponseEntity.ok(movieRepository.findAll());
    }

    @GetMapping(params = "year")
    public ResponseEntity<List<Movie>> getMoviesByYear(@RequestParam String year) {
        if (year != null && !year.isEmpty()) {
        	return ResponseEntity.ok(movieRepository.findByYear(Integer.parseInt(year)));
        }
        return ResponseEntity.ok(movieRepository.findAll());
    }
    
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        return ResponseEntity.ok(movieRepository.save(movie));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMovie(@PathVariable Long id, @RequestHeader(value = "X-User-Role", required = false) String role, @RequestBody Movie movieDetails) {
        if (!ADMIN_ROLE.equals(role)) {
            return ResponseEntity.status(403).body("Admin role required");
        }
        return movieRepository.findById(id).map(movie -> {
            movie.setTitle(movieDetails.getTitle());
            movie.setGenre(movieDetails.getGenre());
            movie.setYear(movieDetails.getYear());
            movie.setDuration(movieDetails.getDuration());
            movie.setSynopsis(movieDetails.getSynopsis());
            movie.setPosterUrl(movieDetails.getPosterUrl());
            return ResponseEntity.ok(movieRepository.save(movie));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMovie(@PathVariable Long id, @RequestHeader(value = "X-User-Role", required = false) String role) {
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
