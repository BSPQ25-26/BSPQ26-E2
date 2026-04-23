package com.bspq.e2.controller;

import com.bspq.e2.model.Movie;
import com.bspq.e2.repository.MovieRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieRepository movieRepository;

    public MovieController(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    @GetMapping
    public ResponseEntity<List<Movie>> getAllMovies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String year) {
        
        if (genre != null && !genre.isEmpty()) {
            return ResponseEntity.ok(movieRepository.findByGenre(genre));
        }
        
        if (year != null && !year.isEmpty()) {
            try {
                return ResponseEntity.ok(movieRepository.findByYear(Integer.parseInt(year)));
            } catch (NumberFormatException e) {
                return ResponseEntity.ok(movieRepository.findAll());
            }
        }
        
        if (search != null && !search.isEmpty()) {
            return ResponseEntity.ok(movieRepository.findByTitleContainingIgnoreCase(search));
        }
        
        return ResponseEntity.ok(movieRepository.findAll());
    }
    
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        Movie safeMovie = Objects.requireNonNull(movie, "movie must not be null");
        return ResponseEntity.ok(movieRepository.save(safeMovie));
    }
}