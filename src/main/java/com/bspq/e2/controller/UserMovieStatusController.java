package com.bspq.e2.controller;

import com.bspq.e2.dto.MovieNoteRequest;
import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.model.Movie;
import com.bspq.e2.service.UserMovieStatusService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<List<Movie>> getWatchLaterList(
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

    @DeleteMapping("/{movieId}/status/watched")
    public ResponseEntity<MovieStatusDTO> removeFromWatched(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeFromWatched(userId, movieId));
    }

    @GetMapping("/watched")
    public ResponseEntity<List<Movie>> getWatchedList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getWatchedList(userId));
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

    @GetMapping("/liked")
    public ResponseEntity<List<Movie>> getLikedList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getLikedList(userId));
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

    @GetMapping("/disliked")
    public ResponseEntity<List<Movie>> getDislikedList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getDislikedList(userId));
    }

    //  Status

    @GetMapping("/{movieId}/status")
    public ResponseEntity<MovieStatusDTO> getStatus(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.getStatus(userId, movieId));
    }

    @PutMapping("/{movieId}/status/note")
    public ResponseEntity<MovieStatusDTO> updateNote(
            @PathVariable Long userId,
            @PathVariable Long movieId,
            @RequestBody MovieNoteRequest request) {
        return ResponseEntity.ok(statusService.updateNote(userId, movieId, request == null ? null : request.getNote()));
    }

    @DeleteMapping("/{movieId}/status/note")
    public ResponseEntity<MovieStatusDTO> clearNote(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.updateNote(userId, movieId, null));
    }
}