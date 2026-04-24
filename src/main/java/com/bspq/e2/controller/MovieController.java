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
    
    @GetMapping
    public ResponseEntity<List<Movie>> getMoviesByGenre(@RequestParam(required = true) String query) {
        if (query != null && !query.isEmpty()) {
        	return ResponseEntity.ok(movieRepository.findByGenre(query));
        }
        return ResponseEntity.ok(movieRepository.findAll());
    }

    @GetMapping
    public ResponseEntity<List<Movie>> getMoviesByYear(@RequestParam(required = true) String query) {
        if (query != null && !query.isEmpty()) {
        	return ResponseEntity.ok(movieRepository.findByYear(Integer.parseInt(query)));
        }
        return ResponseEntity.ok(movieRepository.findAll());
    }
    
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        return ResponseEntity.ok(movieRepository.save(movie));
    }
}
