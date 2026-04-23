package com.bspq.e2.controller;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.dto.MovieRatingRequest;
import com.bspq.e2.service.UserMovieStatusService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/movies")
public class UserMovieStatusController {

    private final UserMovieStatusService statusService;

    public UserMovieStatusController(UserMovieStatusService statusService) {
        this.statusService = statusService;
    }
    //  Watch Later 
    @PostMapping("/{movieId}/status/watch-later")
    public ResponseEntity<MovieStatusDTO> saveForLater(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.saveForLater(userId, movieId));
    }

    @DeleteMapping("/{movieId}/status/watch-later")
    public ResponseEntity<MovieStatusDTO> removeFromWatchLater(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeFromWatchLater(userId, movieId));
    }

    @GetMapping("/watch-later")
    public ResponseEntity<List<MovieStatusDTO>> getWatchLaterList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getWatchLaterList(userId));
    }

    //  Watched

    @PostMapping("/{movieId}/status/watched")
    public ResponseEntity<MovieStatusDTO> markAsWatched(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.markAsWatched(userId, movieId));
    }

    //  Like / Dislike

    @PostMapping("/{movieId}/status/like")
    public ResponseEntity<MovieStatusDTO> likeMovie(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.likeMovie(userId, movieId));
    }

    @DeleteMapping("/{movieId}/status/like")
    public ResponseEntity<MovieStatusDTO> removeLike(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeLike(userId, movieId));
    }

    @PostMapping("/{movieId}/status/dislike")
    public ResponseEntity<MovieStatusDTO> dislikeMovie(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.dislikeMovie(userId, movieId));
    }

    @DeleteMapping("/{movieId}/status/dislike")
    public ResponseEntity<MovieStatusDTO> removeDislike(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeDislike(userId, movieId));
    }

    @PostMapping("/{movieId}/status/rating")
    public ResponseEntity<MovieStatusDTO> rateMovie(
            @PathVariable Long userId,
            @PathVariable Long movieId,
            @RequestBody MovieRatingRequest request) {
        try {
            return ResponseEntity.ok(statusService.rateMovie(userId, movieId, request.getRating()));
        } catch (IllegalStateException | IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage(), ex);
        }
    }

    //  Status

    @GetMapping("/{movieId}/status")
    public ResponseEntity<MovieStatusDTO> getStatus(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.getStatus(userId, movieId));
    }
}