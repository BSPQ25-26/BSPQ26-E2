package com.bspq.e2.controller;

import com.bspq.e2.dto.MovieStatusDTO;
import com.bspq.e2.model.Movie;
import com.bspq.e2.service.UserMovieStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/movies")
@Tag(name = "User Movie Status", description = "Personal lists, preferences, notes and recommendations")
public class UserMovieStatusController {

    private final UserMovieStatusService statusService;

    public UserMovieStatusController(UserMovieStatusService statusService) {
        this.statusService = statusService;
    }
    //  Watch Later
    @PostMapping("/{movieId}/status/watch-later")
    @Operation(summary = "Save movie for later", description = "Adds a movie to the user's watch-later list.")
    public ResponseEntity<MovieStatusDTO> saveForLater(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.saveForLater(userId, movieId));
    }

    @DeleteMapping("/{movieId}/status/watch-later")
    @Operation(summary = "Remove movie from watch later", description = "Removes a movie from the user's watch-later list.")
    public ResponseEntity<MovieStatusDTO> removeFromWatchLater(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeFromWatchLater(userId, movieId));
    }

    @GetMapping("/watch-later")
    @Operation(summary = "List watch-later statuses", description = "Returns status DTOs for the user's watch-later movies.")
    public ResponseEntity<List<MovieStatusDTO>> getWatchLaterList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getWatchLaterList(userId));
    }

    @GetMapping("/watch-later/movies")
    @Operation(summary = "List watch-later movies", description = "Returns movie records saved in the user's watch-later list.")
    public ResponseEntity<List<Movie>> getWatchLaterMovies(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getWatchLaterMovies(userId));
    }

    //  Watched

    @PostMapping("/{movieId}/status/watched")
    @Operation(summary = "Mark movie as watched", description = "Marks a movie as watched and clears watch-later state.")
    public ResponseEntity<MovieStatusDTO> markAsWatched(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.markAsWatched(userId, movieId));
    }

    @DeleteMapping("/{movieId}/status/watched")
    @Operation(summary = "Remove watched flag", description = "Removes a movie from the user's watched list.")
    public ResponseEntity<MovieStatusDTO> removeFromWatched(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeFromWatched(userId, movieId));
    }

    @GetMapping("/watched")
    @Operation(summary = "List watched movies", description = "Returns movie records marked as watched by the user.")
    public ResponseEntity<List<Movie>> getWatchedList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getWatchedList(userId));
    }

    //  Like / Dislike

    @PostMapping("/{movieId}/status/like")
    @Operation(summary = "Like movie", description = "Likes a movie and clears any existing dislike flag.")
    public ResponseEntity<MovieStatusDTO> likeMovie(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.likeMovie(userId, movieId));
    }

    @DeleteMapping("/{movieId}/status/like")
    @Operation(summary = "Remove like", description = "Clears the like flag from a movie.")
    public ResponseEntity<MovieStatusDTO> removeLike(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeLike(userId, movieId));
    }

    @GetMapping("/liked")
    @Operation(summary = "List liked movies", description = "Returns movie records liked by the user.")
    public ResponseEntity<List<Movie>> getLikedList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getLikedList(userId));
    }

    @PostMapping("/{movieId}/status/dislike")
    @Operation(summary = "Dislike movie", description = "Dislikes a movie and clears any existing like flag.")
    public ResponseEntity<MovieStatusDTO> dislikeMovie(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.dislikeMovie(userId, movieId));
    }

    @DeleteMapping("/{movieId}/status/dislike")
    @Operation(summary = "Remove dislike", description = "Clears the dislike flag from a movie.")
    public ResponseEntity<MovieStatusDTO> removeDislike(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.removeDislike(userId, movieId));
    }

    @GetMapping("/disliked")
    @Operation(summary = "List disliked movies", description = "Returns movie records disliked by the user.")
    public ResponseEntity<List<Movie>> getDislikedList(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getDislikedList(userId));
    }

    @GetMapping("/recommendations")
    @Operation(summary = "List recommendations", description = "Returns untracked movies similar to titles the user liked.")
    public ResponseEntity<List<Movie>> getRecommendations(
            @PathVariable Long userId) {
        return ResponseEntity.ok(statusService.getRecommendations(userId));
    }

    //  Status

    @GetMapping("/{movieId}/status")
    @Operation(summary = "Get movie status", description = "Returns all personal status flags and notes for one movie.")
    public ResponseEntity<MovieStatusDTO> getStatus(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.getStatus(userId, movieId));
    }

    @PutMapping("/{movieId}/status/note")
    @Operation(summary = "Update note", description = "Creates or replaces the user's personal note for a movie.")
    public ResponseEntity<MovieStatusDTO> updateNote(
            @PathVariable Long userId,
            @PathVariable Long movieId,
            @RequestBody java.util.Map<String, String> payload) {
        return ResponseEntity.ok(statusService.updateNote(userId, movieId, payload.get("note")));
    }

    @DeleteMapping("/{movieId}/status/note")
    @Operation(summary = "Clear note", description = "Removes the user's personal note for a movie.")
    public ResponseEntity<MovieStatusDTO> clearNote(
            @PathVariable Long userId,
            @PathVariable Long movieId) {
        return ResponseEntity.ok(statusService.updateNote(userId, movieId, null));
    }
}
