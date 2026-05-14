package com.bspq.e2.controller;

import com.bspq.e2.model.Movie;
import com.bspq.e2.repository.MovieRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;

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
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String year) {
        Integer parsedYear = null;
        if (hasText(year)) {
            try {
                parsedYear = Integer.parseInt(year.trim());
            } catch (NumberFormatException ex) {
                return ResponseEntity.badRequest().body(List.of());
            }
        }

        String titleFilter = firstText(title, query);
        Integer yearFilter = parsedYear;
        List<Movie> movies = movieRepository.findAll().stream()
                .filter(movie -> matchesTitle(movie, titleFilter))
                .filter(movie -> matchesGenre(movie, genre))
                .filter(movie -> yearFilter == null || movie.getYear() == yearFilter)
                .toList();

        return ResponseEntity.ok(movies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable Long id) {
        return movieRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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

    private boolean matchesTitle(Movie movie, String titleFilter) {
        if (!hasText(titleFilter)) {
            return true;
        }
        return containsIgnoreCase(movie.getTitle(), titleFilter);
    }

    private boolean matchesGenre(Movie movie, String genreFilter) {
        if (!hasText(genreFilter) || "all".equalsIgnoreCase(genreFilter.trim())) {
            return true;
        }
        return movie.getGenre() != null && movie.getGenre().equalsIgnoreCase(genreFilter.trim());
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(query.trim().toLowerCase(Locale.ROOT));
    }

    private String firstText(String primary, String fallback) {
        if (hasText(primary)) {
            return primary;
        }
        return fallback;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
